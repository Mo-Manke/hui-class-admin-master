<!-- 文件用途：退款管理页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="退款单号" prop="refund_no">
          <el-input v-model="searchParams.refund_no" class="filter-input" clearable placeholder="退款单号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="订单号" prop="order_no">
          <el-input v-model="searchParams.order_no" class="filter-input" clearable placeholder="订单号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in REFUND_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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
        <el-form-item label="成功时间" prop="successAtRange">
          <el-date-picker
            v-model="successAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleSuccessAtChange"
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
        <el-table-column v-if="getVisible('refund_no')" column-key="refund_no" label="退款单号" prop="refund_no" align="center" :min-width="getWidth('refund_no', 180)" />
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
        <el-table-column v-if="getVisible('refund_amount_cent')" column-key="refund_amount_cent" label="退款金额(元)" prop="refund_amount_cent" align="center" :width="getWidth('refund_amount_cent', 140)">
          <template #default="{ row }">{{ formatAmount(row.refund_amount_cent) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tooltip v-if="row.status === 'FAILED' && row.failure_reason" :content="row.failure_reason" placement="top">
              <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </el-tooltip>
            <el-tag v-else :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('reason')" column-key="reason" label="原因" prop="reason" align="center" :min-width="getWidth('reason', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('provider')" column-key="provider" label="渠道" prop="provider" align="center" :width="getWidth('provider', 120)">
          <template #default="{ row }">
            <el-tag v-if="row.provider" :type="getProviderTag(row.provider)">{{ getProviderLabel(row.provider) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('provider_refund_id')" column-key="provider_refund_id" label="渠道退款号" prop="provider_refund_id" align="center" :min-width="getWidth('provider_refund_id', 180)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('created_by')" column-key="created_by" label="创建人" prop="created_by" align="center" :width="getWidth('created_by', 160)">
          <template #default="{ row }">
            <div class="creator-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.created_by_user?.avatar)" class="creator-avatar">
                {{ row.created_by_user?.nickname?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="creator-name">{{ row.created_by_user?.nickname || row.created_by || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('successAt')" column-key="successAt" label="成功时间" prop="successAt" align="center" :width="getWidth('successAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.successAt) }}</template>
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
import { PAYMENT_PROVIDER_OPTIONS, REFUND_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { getRefundList } from "@/api/trade/refunds";
import type { RefundListQuery, RefundView } from "@/api/trade/refunds/type";
import { koiMsgError, koiNoticeError } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const tableData = ref<RefundView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);

// 查询参数
const searchParams = reactive<RefundListQuery>({
  page: 1,
  limit: 10,
  refund_no: "",
  order_no: "",
  status: "",
  createdAtFrom: "",
  createdAtTo: "",
  successAtFrom: "",
  successAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const createdAtRange = ref<[string, string] | []>([]);
const successAtRange = ref<[string, string] | []>([]);
const baseUrl = import.meta.env.VITE_SERVER;

const columns = [
  { key: "refund_no", label: "退款单号", defaultWidth: 180 },
  { key: "order_no", label: "订单号", defaultWidth: 180 },
  { key: "user_id", label: "用户", defaultWidth: 180 },
  { key: "refund_amount_cent", label: "退款金额(元)", defaultWidth: 140 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "reason", label: "原因", defaultWidth: 160 },
  { key: "provider", label: "渠道", defaultWidth: 120 },
  { key: "provider_refund_id", label: "渠道退款号", defaultWidth: 180 },
  { key: "created_by", label: "创建人", defaultWidth: 120 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 },
  { key: "successAt", label: "成功时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-trade-refunds",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 获取状态显示文本
const getStatusLabel = (value: string) => {
  return REFUND_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: string) => {
  return REFUND_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getProviderLabel = (value?: string | null) => {
  if (!value) return "-";
  return PAYMENT_PROVIDER_OPTIONS.find(item => item.value === value)?.label || value;
};

const getProviderTag = (value?: string | null) => {
  if (!value) return "info";
  return PAYMENT_PROVIDER_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const resolveAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";
  return avatar.includes("http") ? avatar : `${baseUrl}${avatar}`;
};

// 获取列表
const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getRefundList(searchParams);
    tableData.value = (res.data || []).map((item: RefundView) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
      successAt: formatDate(item.successAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取退款列表失败");
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
  searchParams.refund_no = "";
  searchParams.order_no = "";
  searchParams.status = "";
  searchParams.createdAtFrom = "";
  searchParams.createdAtTo = "";
  searchParams.successAtFrom = "";
  searchParams.successAtTo = "";
  createdAtRange.value = [];
  successAtRange.value = [];
  fetchList();
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

// 成功时间范围变化
const handleSuccessAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.successAtFrom = value[0];
    searchParams.successAtTo = value[1];
  } else {
    searchParams.successAtFrom = "";
    searchParams.successAtTo = "";
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

const goToOrder = (row: RefundView) => {
  if (!row.order_no) return;
  router.push({ path: "/admin/trade/orders", query: { order_no: row.order_no } });
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
  const header = ["退款单号", "订单号", "用户ID", "退款金额(元)", "状态", "原因", "渠道", "渠道退款号", "创建人", "创建时间", "成功时间"];
  const rows = tableData.value.map(item => [
    item.refund_no,
    item.order_no,
    item.user_id,
    formatAmount(item.refund_amount_cent),
    getStatusLabel(item.status),
    item.reason || "",
    item.provider || "",
    item.provider_refund_id || "",
    item.created_by || "",
    item.createdAt || "-",
    item.successAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "refunds.csv");
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

.creator-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.creator-avatar {
  flex-shrink: 0;
}

.creator-name {
  color: var(--el-text-color-regular);
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
