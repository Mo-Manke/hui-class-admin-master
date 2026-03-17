<!-- 文件用途：订单管理页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="订单号" prop="order_no">
          <el-input v-model="searchParams.order_no" class="filter-input" clearable placeholder="订单号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="用户ID" prop="user_id">
          <div class="user-picker">
            <el-button type="primary" plain @click="openUserDialog">选择用户</el-button>
            <div v-if="selectedUser || searchParams.user_id" class="user-picker__value">
              <span class="user-picker__text">
                {{ selectedUser ? `${selectedUser.nickname || selectedUser.username} (#${selectedUser.id})` : `ID: ${searchParams.user_id}` }}
              </span>
              <el-button type="danger" link @click="clearSelectedUser">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" multiple class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in ORDER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道" prop="channel">
          <el-select v-model="searchParams.channel" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-table-column v-if="getVisible('order_no')" column-key="order_no" label="订单号" prop="order_no" align="center" :min-width="getWidth('order_no', 180)" sortable="custom" />
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
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="退款状态" align="center" :width="140">
          <template #default="{ row }">
            <el-tooltip v-if="getRowRefundStatus(row) === 'FAILED' && row.refund_failure_reason" :content="row.refund_failure_reason" placement="top">
              <el-tag type="info">
                {{ getRefundStatusLabel(getRowRefundStatus(row)) }}
              </el-tag>
            </el-tooltip>
            <el-tag v-else-if="getRowRefundStatus(row)" type="info">
              {{ getRefundStatusLabel(getRowRefundStatus(row)) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('currency')" column-key="currency" label="币种" prop="currency" align="center" :width="getWidth('currency', 100)">
          <template #default="{ row }">
            <el-tag v-if="row.currency" :type="getCurrencyTag(row.currency)">{{ getCurrencyLabel(row.currency) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('total_amount_cent')" column-key="total_amount_cent" label="总金额(元)" prop="total_amount_cent" align="center" :width="getWidth('total_amount_cent', 140)">
          <template #default="{ row }">{{ formatAmount(row.total_amount_cent) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('channel')" column-key="channel" label="渠道" prop="channel" align="center" :width="getWidth('channel', 120)">
          <template #default="{ row }">
            <el-tag v-if="row.channel" :type="getChannelTag(row.channel)">{{ getChannelLabel(row.channel) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)" sortable="custom" />
        <el-table-column v-if="getVisible('paidAt')" column-key="paidAt" label="支付时间" prop="paidAt" align="center" :width="getWidth('paidAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.paidAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" :width="240">
          <template #default="{ row }">
            <div class="action-cell">
              <el-button type="primary" link @click="goToDetail(row)">详情</el-button>
              <el-dropdown trigger="hover">
                <el-button link type="info">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status === 'CREATED'" @click="handleCancel(row)">取消</el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'PAID'"
                      :disabled="!!getRowRefundStatus(row) || refundSubmittingId === row.id"
                      @click="handleRefund(row)"
                    >
                      退款
                    </el-dropdown-item>
                    <el-dropdown-item @click="goToPayments(row)">查询此订单支付记录</el-dropdown-item>
                    <el-dropdown-item @click="goToRefunds(row)">查询此订单退款记录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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
      <UserSelectDialog v-model="userDialogVisible" @select="handleSelectUser" />
      <el-dialog v-model="refundDialogVisible" title="确认退款" width="520px">
        <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="90px">
          <el-form-item label="订单号">
            <el-input v-model="refundForm.order_no" disabled />
          </el-form-item>
          <el-form-item label="退款原因" prop="reason">
            <el-input v-model="refundForm.reason" type="textarea" :rows="3" placeholder="请输入退款原因" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="refundSubmitting" @click="submitRefund">确认退款</el-button>
        </template>
      </el-dialog>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Close } from "@element-plus/icons-vue";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { CHANNEL_OPTIONS, CURRENCY_OPTIONS, ORDER_STATUS_OPTIONS, REFUND_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { cancelOrder, createOrderRefund, getOrderList } from "@/api/trade/orders";
import type { OrderListQuery, OrderView } from "@/api/trade/orders/type";
import { koiMsgBox, koiMsgError, koiMsgInfo, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";
import UserSelectDialog from "@/components/Common/UserSelectDialog.vue";
import type { AppUser } from "@/api/appUser/type";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const tableData = ref<OrderView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const userDialogVisible = ref(false);
const selectedUser = ref<AppUser | null>(null);
const refundDialogVisible = ref(false);
const refundSubmitting = ref(false);
const refundFormRef = ref();
const refundForm = reactive({
  order_id: null as number | null,
  order_no: "",
  reason: ""
});
const refundRules = reactive({
  reason: [{ required: true, message: "请输入退款原因", trigger: "blur" }]
});
const refundStatusMap = reactive<Record<number, string>>({});
const refundSubmittingId = ref<number | null>(null);
const baseUrl = import.meta.env.VITE_SERVER;

// 查询参数
const searchParams = reactive<OrderListQuery>({
  page: 1,
  limit: 10,
  order_no: "",
  user_id: "",
  status: [],
  channel: "",
  createdAtFrom: "",
  createdAtTo: "",
  paidAtFrom: "",
  paidAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const createdAtRange = ref<[string, string] | []>([]);
const paidAtRange = ref<[string, string] | []>([]);

const columns = [
  { key: "order_no", label: "订单号", defaultWidth: 180 },
  { key: "user_id", label: "用户", defaultWidth: 180 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "currency", label: "币种", defaultWidth: 100 },
  { key: "total_amount_cent", label: "总金额(元)", defaultWidth: 140 },
  { key: "channel", label: "渠道", defaultWidth: 120 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 },
  { key: "paidAt", label: "支付时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-trade-orders",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 获取状态显示文本
const getStatusLabel = (value: string) => {
  return ORDER_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: string) => {
  return ORDER_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getRefundStatusLabel = (value: string) => {
  return REFUND_STATUS_OPTIONS.find(item => item.value === value)?.label || value || "-";
};

const resolveAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";
  return avatar.includes("http") ? avatar : `${baseUrl}${avatar}`;
};

const getChannelLabel = (value?: string | null) => {
  if (!value) return "-";
  return CHANNEL_OPTIONS.find(item => item.value === value)?.label || value;
};

const getChannelTag = (value?: string | null) => {
  if (!value) return "info";
  return CHANNEL_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getCurrencyLabel = (value?: string | null) => {
  if (!value) return "-";
  return CURRENCY_OPTIONS.find(item => item.value === value)?.label || value;
};

const getCurrencyTag = (value?: string | null) => {
  if (!value) return "info";
  return CURRENCY_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getRowRefundStatus = (row: OrderView) => {
  if (!row?.id) return "";
  if (row.refund_status) return row.refund_status;
  if (refundStatusMap[row.id]) return refundStatusMap[row.id];
  if (row.status === "REFUNDED") return "SUCCESS";
  return "";
};

// 获取列表
const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const queryParams = {
      ...searchParams,
      status: Array.isArray(searchParams.status) && searchParams.status.length ? searchParams.status.join(",") : undefined
    };
    if (!queryParams.status) {
      delete queryParams.status;
    }
    const res = await getOrderList(queryParams);
    tableData.value = (res.data || []).map((item: OrderView) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
      paidAt: item.paidAt ? formatDate(item.paidAt) : "-"
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取订单列表失败");
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
  searchParams.user_id = "";
  selectedUser.value = null;
  searchParams.status = [];
  searchParams.channel = "";
  searchParams.createdAtFrom = "";
  searchParams.createdAtTo = "";
  searchParams.paidAtFrom = "";
  searchParams.paidAtTo = "";
  createdAtRange.value = [];
  paidAtRange.value = [];
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

// 跳转详情
const goToDetail = (row: OrderView) => {
  router.push({ path: `/admin/trade/orders/${row.id}` });
};

const goToRefunds = (row: OrderView) => {
  if (!row.order_no) return;
  router.push({ path: "/admin/trade/refunds", query: { order_no: row.order_no } });
};

const goToPayments = (row: OrderView) => {
  if (!row.order_no) return;
  router.push({ path: "/admin/trade/payments", query: { order_no: row.order_no } });
};

const openUserDialog = () => {
  userDialogVisible.value = true;
};

const handleSelectUser = (row: AppUser) => {
  selectedUser.value = row;
  searchParams.user_id = String(row.id);
  userDialogVisible.value = false;
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  searchParams.user_id = "";
};

// 取消订单
const handleCancel = (row: OrderView) => {
  koiMsgBox(`确认取消订单【${row.order_no}】？`)
    .then(async () => {
      try {
        await cancelOrder(row.id, {});
        koiNoticeSuccess("取消成功");
        fetchList();
      } catch (error) {
        const state = resolveRequestError(error, "取消失败");
        koiNoticeError(state.message);
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

// 发起退款
const handleRefund = (row: OrderView) => {
  const existingStatus = getRowRefundStatus(row);
  if (existingStatus) {
    koiMsgInfo(`已存在退款记录，状态：${getRefundStatusLabel(existingStatus)}`);
    return;
  }
  refundForm.order_id = Number(row.id);
  refundForm.order_no = row.order_no || "";
  refundForm.reason = "";
  refundDialogVisible.value = true;
  refundFormRef.value?.clearValidate?.();
};

const submitRefund = () => {
  if (!refundFormRef.value) return;
  refundFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      refundSubmittingId.value = refundForm.order_id as number;
      refundSubmitting.value = true;
      const res = await createOrderRefund(refundForm.order_id as number, { reason: refundForm.reason });
      const refund = res?.data?.data || res?.data || null;
      if (refund?.status) {
        const orderId = refundForm.order_id as number;
        refundStatusMap[orderId] = refund.status;
        tableData.value = tableData.value.map(item =>
          item.id === orderId ? { ...item, refund_status: refund.status } : item
        );
      }
      koiNoticeSuccess("退款已提交");
      refundDialogVisible.value = false;
      fetchList();
    } catch (error) {
      const state = resolveRequestError(error, "退款失败");
      koiNoticeError(state.message);
    } finally {
      refundSubmitting.value = false;
      refundSubmittingId.value = null;
    }
  });
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
  const header = ["订单号", "用户ID", "状态", "币种", "总金额(元)", "渠道", "创建时间", "支付时间"];
  const rows = tableData.value.map(item => [
    item.order_no,
    item.user_id,
    getStatusLabel(item.status),
    item.currency,
    formatAmount(item.total_amount_cent),
    item.channel,
    item.createdAt,
    item.paidAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "orders.csv");
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

.user-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-picker__value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-picker__text {
  color: var(--el-text-color-regular);
}

.action-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
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

.refund-status-tag {
  margin-left: 6px;
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}
</style>
