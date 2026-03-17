<!-- 文件用途：订单详情页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <div class="detail-toolbar">
        <el-button icon="ArrowLeft" plain @click="handleBack">返回列表</el-button>
        <div class="detail-toolbar__actions">
          <el-button v-if="orderInfo && orderInfo.status === 'CREATED'" type="warning" plain @click="handleCancel">取消订单</el-button>
          <el-button v-if="orderInfo && orderInfo.status === 'PAID'" type="danger" plain :disabled="hasRefund" @click="handleRefund">发起退款</el-button>
          <el-tooltip
            v-if="hasRefund && latestRefundStatus === 'FAILED' && orderInfo?.refund_failure_reason"
            :content="orderInfo.refund_failure_reason"
            placement="top"
          >
            <el-tag type="info">退款状态：{{ getRefundStatusLabel(latestRefundStatus) }}</el-tag>
          </el-tooltip>
          <el-tag v-else-if="hasRefund" type="info">退款状态：{{ getRefundStatusLabel(latestRefundStatus) }}</el-tag>
        </div>
      </div>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <div v-else>
        <el-descriptions title="订单信息" :column="2" border>
          <el-descriptions-item label="订单号">
            <div class="copyable">
              <span>{{ orderInfo?.order_no || '-' }}</span>
              <el-button type="primary" link @click="copyText(orderInfo?.order_no || '')">复制</el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ orderInfo?.user_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(orderInfo?.status)">{{ getStatusLabel(orderInfo?.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="币种">
            <el-tag v-if="orderInfo?.currency" :type="getCurrencyTag(orderInfo.currency)">{{ getCurrencyLabel(orderInfo.currency) }}</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="总金额(元)">{{ formatAmount(orderInfo?.total_amount_cent || 0) }}</el-descriptions-item>
          <el-descriptions-item label="渠道">
            <el-tag v-if="orderInfo?.channel" :type="getChannelTag(orderInfo.channel)">{{ getChannelLabel(orderInfo.channel) }}</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(orderInfo?.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDate(orderInfo?.paidAt) }}</el-descriptions-item>
          <el-descriptions-item label="幂等键" :span="2">
            <div class="copyable">
              <span>{{ detailInfo?.idempotency_key || '-' }}</span>
              <el-button type="primary" link @click="copyText(detailInfo?.idempotency_key || '')">复制</el-button>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section">
          <div class="section__title">订单项</div>
          <el-table v-loading="loading" border :data="items" empty-text="暂无数据" class="list-table">
            <el-table-column label="套餐ID" prop="plan_id" width="120" align="center" />
            <el-table-column label="价格ID" prop="price_id" width="120" align="center" />
            <el-table-column label="时长(天)" prop="duration_days" width="120" align="center" />
            <el-table-column label="原价(元)" prop="list_price_cent" width="140" align="center">
              <template #default="{ row }">{{ formatAmount(row.list_price_cent) }}</template>
            </el-table-column>
            <el-table-column label="成交价(元)" prop="final_price_cent" width="140" align="center">
              <template #default="{ row }">{{ formatAmount(row.final_price_cent) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section">
          <div class="section__title">支付记录</div>
          <el-table v-loading="loading" border :data="payments" empty-text="暂无数据" class="list-table">
            <el-table-column label="渠道" prop="provider" width="140" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.provider" :type="getProviderTag(row.provider)">{{ getProviderLabel(row.provider) }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="交易号" prop="provider_txn_id" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" width="120" align="center">
              <template #default="{ row }">
                <el-tooltip v-if="row.status === 'FAILED' && row.failure_reason" :content="row.failure_reason" placement="top">
                  <el-tag :type="getPaymentStatusTag(row.status)">{{ getPaymentStatusLabel(row.status) }}</el-tag>
                </el-tooltip>
                <el-tag v-else :type="getPaymentStatusTag(row.status)">{{ getPaymentStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额(元)" prop="paid_amount_cent" width="140" align="center">
              <template #default="{ row }">{{ formatAmount(row.paid_amount_cent) }}</template>
            </el-table-column>
            <el-table-column label="支付时间" prop="paidAt" width="180" align="center">
              <template #default="{ row }">{{ formatDate(row.paidAt) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section">
          <div class="section__title">退款记录</div>
          <el-table v-loading="loading" border :data="refunds" empty-text="暂无数据" class="list-table">
            <el-table-column label="退款单号" prop="refund_no" min-width="180" align="center" />
            <el-table-column label="状态" prop="status" width="120" align="center">
              <template #default="{ row }">
                <el-tooltip v-if="row.status === 'FAILED' && row.failure_reason" :content="row.failure_reason" placement="top">
                  <el-tag :type="getRefundStatusTag(row.status)">{{ getRefundStatusLabel(row.status) }}</el-tag>
                </el-tooltip>
                <el-tag v-else :type="getRefundStatusTag(row.status)">{{ getRefundStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="退款金额(元)" prop="refund_amount_cent" width="140" align="center">
              <template #default="{ row }">{{ formatAmount(row.refund_amount_cent) }}</template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.currency" :type="getCurrencyTag(row.currency)">{{ getCurrencyLabel(row.currency) }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="原因" prop="reason" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="createdAt" width="180" align="center">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="成功时间" prop="successAt" width="180" align="center">
              <template #default="{ row }">{{ formatDate(row.successAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
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
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CHANNEL_OPTIONS, CURRENCY_OPTIONS, ORDER_STATUS_OPTIONS, PAYMENT_PROVIDER_OPTIONS, PAYMENT_STATUS_OPTIONS, REFUND_STATUS_OPTIONS } from "@/config/enums";
import { cancelOrder, createOrderRefund, getOrderDetail } from "@/api/trade/orders";
import type { OrderDetailView, OrderItemView, OrderPaymentView, OrderRefundView, OrderView } from "@/api/trade/orders/type";
import { koiMsgBox, koiMsgError, koiMsgInfo, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);
const detailInfo = ref<OrderDetailView | null>(null);
const orderInfo = ref<OrderView | null>(null);
const items = ref<OrderItemView[]>([]);
const payments = ref<OrderPaymentView[]>([]);
const refunds = ref<OrderRefundView[]>([]);
const refundDialogVisible = ref(false);
const refundSubmitting = ref(false);
const refundFormRef = ref();
const refundForm = ref({
  order_id: 0,
  order_no: "",
  reason: ""
});
const refundRules = reactive({
  reason: [{ required: true, message: "请输入退款原因", trigger: "blur" }]
});

const orderId = computed(() => String(route.params.order_id || ""));
const hasRefund = computed(() => refunds.value.length > 0);
const latestRefundStatus = computed(() => {
  if (!refunds.value.length) return "";
  const sorted = [...refunds.value].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
  return sorted[0]?.status || "";
});

// 获取状态显示文本
const getStatusLabel = (value?: string | null) => {
  if (!value) return "-";
  return ORDER_STATUS_OPTIONS.find(item => item.value === value)?.label || value;
};

// 获取状态标签样式
const getStatusTag = (value?: string | null) => {
  if (!value) return "info";
  return ORDER_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getRefundStatusLabel = (value?: string | null) => {
  if (!value) return "-";
  return REFUND_STATUS_OPTIONS.find(item => item.value === value)?.label || value;
};

const getRefundStatusTag = (value?: string | null) => {
  if (!value) return "info";
  return REFUND_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const getPaymentStatusLabel = (value?: string | null) => {
  if (!value) return "-";
  return PAYMENT_STATUS_OPTIONS.find(item => item.value === value)?.label || value;
};

const getPaymentStatusTag = (value?: string | null) => {
  if (!value) return "info";
  return PAYMENT_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
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

const getProviderLabel = (value?: string | null) => {
  if (!value) return "-";
  return PAYMENT_PROVIDER_OPTIONS.find(item => item.value === value)?.label || value;
};

const getProviderTag = (value?: string | null) => {
  if (!value) return "info";
  return PAYMENT_PROVIDER_OPTIONS.find(item => item.value === value)?.tagType || "info";
};
// 获取详情数据
const fetchDetail = async () => {
  if (!orderId.value) return;
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getOrderDetail(orderId.value);
    detailInfo.value = res.data;
    orderInfo.value = res.data.order;
    items.value = res.data.items || [];
    payments.value = res.data.payment ? [res.data.payment] : [];
    refunds.value = res.data.refunds || [];
  } catch (error) {
    const state = resolveRequestError(error, "获取订单详情失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

// 返回列表
const handleBack = () => {
  router.push({ path: "/admin/trade/orders" });
};

// 取消订单
const handleCancel = () => {
  const currentOrder = orderInfo.value;
  if (!currentOrder) return;
  koiMsgBox(`确认取消订单【${currentOrder.order_no}】？`)
    .then(async () => {
      try {
        await cancelOrder(currentOrder.id, {});
        koiNoticeSuccess("取消成功");
        fetchDetail();
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
const handleRefund = () => {
  if (!orderInfo.value) return;
  if (hasRefund.value) {
    koiMsgInfo(`已存在退款记录，状态：${getRefundStatusLabel(latestRefundStatus.value)}`);
    return;
  }
  refundForm.value = {
    order_id: Number(orderInfo.value.id),
    order_no: orderInfo.value.order_no || "",
    reason: ""
  };
  refundDialogVisible.value = true;
  refundFormRef.value?.clearValidate?.();
};

const submitRefund = () => {
  if (!refundFormRef.value) return;
  refundFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      refundSubmitting.value = true;
      await createOrderRefund(refundForm.value.order_id, { reason: refundForm.value.reason });
      koiNoticeSuccess("退款已提交");
      refundDialogVisible.value = false;
      fetchDetail();
    } catch (error) {
      const state = resolveRequestError(error, "退款失败");
      koiNoticeError(state.message);
    } finally {
      refundSubmitting.value = false;
    }
  });
};

// 复制文本
const copyText = async (value: string) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    koiNoticeSuccess("复制成功");
  } catch (error) {
    koiMsgError("复制失败");
  }
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

onMounted(() => {
  fetchDetail();
});
</script>

<style lang="scss" scoped>
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-toolbar__actions {
  display: flex;
  gap: 8px;
}

.section {
  margin-top: 20px;
}

.section__title {
  margin-bottom: 10px;
  font-weight: 600;
}

.list-table {
  width: 100%;
}

.copyable {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
