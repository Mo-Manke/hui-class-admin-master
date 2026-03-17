<!-- 文件用途：支付记录页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="订单号" prop="order_no">
          <el-input v-model="searchParams.order_no" class="filter-input" clearable placeholder="订单号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="渠道" prop="provider">
          <el-input v-model="searchParams.provider" class="filter-input" clearable placeholder="支付渠道" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in PAYMENT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付时间" prop="paidAtRange">
          <el-date-picker
            v-model="paidAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handlePaidAtChange"
          />
        </el-form-item>
        <el-form-item label="创建时间" prop="createdAtRange">
          <el-date-picker
            v-model="createdAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleCreatedAtChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <ListToolbar
          v-model:showSearch="showSearch"
          :show-export="true"
          :columns="columns"
          :column-state="columnState"
          @refresh="fetchList"
          @export="handleExport"
          @toggle-column="setVisible"
          @reset-columns="resetColumns"
        />
      </el-row>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <el-table
        v-else
        v-loading="loading"
        border
        :data="tableData"
        class="list-table"
        empty-text="暂无数据"
        @sort-change="handleSortChange"
        @header-dragend="handleHeaderDragend"
      >
        <el-table-column v-if="getVisible('order_id')" column-key="order_id" label="订单ID" prop="order_id" align="center" :width="getWidth('order_id', 120)" />
        <el-table-column v-if="getVisible('order_no')" column-key="order_no" label="订单号" prop="order_no" align="center" :min-width="getWidth('order_no', 180)" />
        <el-table-column v-if="getVisible('user_id')" column-key="user_id" label="用户" prop="user_id" align="center" :width="getWidth('user_id', 180)">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.user?.avatar)" class="user-avatar">
                {{ row.user?.nickname?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="user-name">{{ row.user?.nickname || row.user_id || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('provider')" column-key="provider" label="渠道" prop="provider" align="center" :width="getWidth('provider', 120)">
          <template #default="{ row }">
            <el-tag v-if="row.provider" :type="getProviderTag(row.provider)">{{ getProviderLabel(row.provider) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('provider_txn_id')" column-key="provider_txn_id" label="渠道交易号" prop="provider_txn_id" align="center" :min-width="getWidth('provider_txn_id', 200)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tooltip v-if="row.status === 'FAILED' && row.failure_reason" :content="row.failure_reason" placement="top">
              <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </el-tooltip>
            <el-tag v-else :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('paid_amount_cent')" column-key="paid_amount_cent" label="支付金额(元)" prop="paid_amount_cent" align="center" :width="getWidth('paid_amount_cent', 140)">
          <template #default="{ row }">{{ formatAmount(row.paid_amount_cent) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('currency')" column-key="currency" label="币种" prop="currency" align="center" :width="getWidth('currency', 100)">
          <template #default="{ row }">
            <el-tag v-if="row.currency" :type="getCurrencyTag(row.currency)">{{ getCurrencyLabel(row.currency) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('paidAt')" column-key="paidAt" label="支付时间" prop="paidAt" align="center" :width="getWidth('paidAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.paidAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" :width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToOrder(row)">查询此订单</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        background
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.totalRecords"
        class="list-pagination"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { CURRENCY_OPTIONS, PAYMENT_PROVIDER_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { getPaymentList } from "@/api/trade/payments";
import type { PaymentListQuery, PaymentView } from "@/api/trade/payments/type";
import { koiMsgError, koiNoticeError } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";

const loading = ref(false);
const tableData = ref<PaymentView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const router = useRouter();
const route = useRoute();
const baseUrl = import.meta.env.VITE_SERVER;

// 查询参数
const searchParams = reactive<PaymentListQuery>({
  page: 1,
  limit: 10,
  order_no: "",
  provider: "",
  status: "",
  paidAtFrom: "",
  paidAtTo: "",
  createdAtFrom: "",
  createdAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const paidAtRange = ref<[string, string] | []>([]);
const createdAtRange = ref<[string, string] | []>([]);

const columns = [
  { key: "order_id", label: "订单ID", defaultWidth: 120 },
  { key: "order_no", label: "订单号", defaultWidth: 180 },
  { key: "user_id", label: "用户", defaultWidth: 180 },
  { key: "provider", label: "渠道", defaultWidth: 120 },
  { key: "provider_txn_id", label: "渠道交易号", defaultWidth: 200 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "paid_amount_cent", label: "支付金额(元)", defaultWidth: 140 },
  { key: "currency", label: "币种", defaultWidth: 100 },
  { key: "paidAt", label: "支付时间", defaultWidth: 180 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-trade-payments",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 获取状态显示文本
const getStatusLabel = (value: string) => {
  return PAYMENT_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: string) => {
  return PAYMENT_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const resolveAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";
  return avatar.includes("http") ? avatar : `${baseUrl}${avatar}`;
};

const getProviderLabel = (value?: string | null) => {
  if (!value) return "-";
  return PAYMENT_PROVIDER_OPTIONS.find(item => item.value === value)?.label || value;
};

const getProviderTag = (value?: string | null) => {
  if (!value) return "info";
  return PAYMENT_PROVIDER_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getCurrencyLabel = (value?: string | null) => {
  if (!value) return "-";
  return CURRENCY_OPTIONS.find(item => item.value === value)?.label || value;
};

const getCurrencyTag = (value?: string | null) => {
  if (!value) return "info";
  return CURRENCY_OPTIONS.find(item => item.value === value)?.tagType || "info";
};
// 获取列表
const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getPaymentList(searchParams);
    tableData.value = (res.data || []).map((item: PaymentView) => ({
      ...item,
      paidAt: formatDate(item.paidAt),
      createdAt: formatDate(item.createdAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取支付列表失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  searchParams.page = 1;
  fetchList();
};

// 重置搜索
const resetSearch = () => {
  searchParams.page = 1;
  searchParams.limit = 10;
  searchParams.order_no = "";
  searchParams.provider = "";
  searchParams.status = "";
  searchParams.paidAtFrom = "";
  searchParams.paidAtTo = "";
  searchParams.createdAtFrom = "";
  searchParams.createdAtTo = "";
  paidAtRange.value = [];
  createdAtRange.value = [];
  fetchList();
};

// 支付时间范围变化
const handlePaidAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.paidAtFrom = value[0];
    searchParams.paidAtTo = value[1];
  } else {
    searchParams.paidAtFrom = "";
    searchParams.paidAtTo = "";
  }
};

// 创建时间范围变化
const handleCreatedAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.createdAtFrom = value[0];
    searchParams.createdAtTo = value[1];
  } else {
    searchParams.createdAtFrom = "";
    searchParams.createdAtTo = "";
  }
};

// 排序
const handleSortChange = (payload: { prop: string; order: "ascending" | "descending" | null }) => {
  if (!payload.order) {
    delete (searchParams as Record<string, string>).sort_by;
    delete (searchParams as Record<string, string>).sort_order;
  } else {
    (searchParams as Record<string, string>).sort_by = payload.prop;
    (searchParams as Record<string, string>).sort_order = payload.order === "ascending" ? "ASC" : "DESC";
  }
  fetchList();
};

// 格式化时间
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

// 格式化金额
const formatAmount = (value: number) => {
  if (Number.isNaN(value)) return "-";
  return (value / 100).toFixed(2);
};

// 导出
const handleExport = () => {
  if (!tableData.value.length) {
    koiMsgError("暂无数据可导出");
    return;
  }
  const header = ["订单ID", "订单号", "渠道", "渠道交易号", "状态", "支付金额(元)", "币种", "支付时间", "创建时间"];
  const rows = tableData.value.map(item => [
    item.order_id,
    item.order_no,
    item.provider,
    item.provider_txn_id,
    getStatusLabel(item.status),
    formatAmount(item.paid_amount_cent),
    item.currency,
    item.paidAt || "-",
    item.createdAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "payments.csv");
};

const goToOrder = (row: PaymentView) => {
  if (!row.order_no) return;
  router.push({ path: "/admin/trade/orders", query: { order_no: row.order_no } });
};

onMounted(() => {
  if (route.query.order_no) {
    searchParams.order_no = String(route.query.order_no || "");
  }
  fetchList();
});
</script>

<style lang="scss" scoped>
.filter-form {
  margin-bottom: 12px;
}

.filter-input {
  width: 200px;
}

.filter-select {
  width: 160px;
}

.filter-date {
  width: 240px;
}

.list-toolbar-row {
  margin-bottom: 12px;
}

.list-table {
  width: 100%;
}

.list-pagination {
  margin-top: 16px;
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  color: var(--el-text-color-regular);
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}
</style>
