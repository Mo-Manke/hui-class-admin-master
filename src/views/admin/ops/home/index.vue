<!-- 文件用途：运营概览页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <div class="overview-toolbar">
        <el-radio-group v-model="period" size="small" @change="fetchSummary">
          <el-radio-button label="day">按天</el-radio-button>
          <el-radio-button label="week">按周</el-radio-button>
        </el-radio-group>
        <el-button icon="Refresh" circle @click="fetchSummary" />
      </div>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <el-row v-else :gutter="16" class="overview-grid">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="overview-card">
            <div class="overview-card__label">订单数</div>
            <div class="overview-card__value">{{ summary.order_count }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="overview-card">
            <div class="overview-card__label">支付成功率</div>
            <div class="overview-card__value">{{ formatRate(summary.payment_success_rate) }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="overview-card">
            <div class="overview-card__label">退款率</div>
            <div class="overview-card__value">{{ formatRate(summary.refund_rate) }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="overview-card">
            <div class="overview-card__label">兑换成功率</div>
            <div class="overview-card__value">{{ formatRate(summary.redeem_success_rate) }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="overview-card">
            <div class="overview-card__label">活跃会员数</div>
            <div class="overview-card__value">{{ summary.active_members }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="overview-card">
            <div class="overview-card__label">到期会员数</div>
            <div class="overview-card__value">{{ summary.expired_members }}</div>
          </div>
        </el-col>
      </el-row>

      <el-skeleton v-if="loading" :rows="6" animated class="overview-skeleton" />
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { getOrderList } from "@/api/trade/orders";
import { getPaymentList } from "@/api/trade/payments";
import { getRefundList } from "@/api/trade/refunds";
import { getRedeemRecordList } from "@/api/redeem/records";
import { getSubscriptionList } from "@/api/membership/subscriptions";
import { normalizePagination } from "@/api/common/pagination";
import { koiNoticeError } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";

const loading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);
const period = ref("day");

const summary = reactive({
  order_count: 0,
  payment_success_rate: 0,
  refund_rate: 0,
  redeem_success_rate: 0,
  active_members: 0,
  expired_members: 0
});

// 获取时间范围
const getDateRange = (rangeType: string) => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  if (rangeType === "week") {
    start.setDate(end.getDate() - 6);
  }
  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { start: format(start), end: format(end) };
};

// 获取概览数据
const fetchSummary = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;

    const range = getDateRange(period.value);
    const [orderRes, paymentRes, paymentSuccessRes, refundRes, redeemRes, redeemSuccessRes, activeRes, expiredRes] = await Promise.all([
      getOrderList({ page: 1, limit: 1, createdAtFrom: range.start, createdAtTo: range.end }),
      getPaymentList({ page: 1, limit: 1, createdAtFrom: range.start, createdAtTo: range.end }),
      getPaymentList({ page: 1, limit: 1, status: "SUCCESS", createdAtFrom: range.start, createdAtTo: range.end }),
      getRefundList({ page: 1, limit: 1, createdAtFrom: range.start, createdAtTo: range.end }),
      getRedeemRecordList({ page: 1, limit: 1, redeemedAtFrom: range.start, redeemedAtTo: range.end }),
      getRedeemRecordList({ page: 1, limit: 1, status: "SUCCESS", redeemedAtFrom: range.start, redeemedAtTo: range.end }),
      getSubscriptionList({ page: 1, limit: 1, status: "ACTIVE" }),
      getSubscriptionList({ page: 1, limit: 1, status: "EXPIRED" })
    ]);

    const orderCount = normalizePagination(orderRes).totalRecords ?? 0;
    const paymentCount = normalizePagination(paymentRes).totalRecords ?? 0;
    const paymentSuccessCount = normalizePagination(paymentSuccessRes).totalRecords ?? 0;
    const refundCount = normalizePagination(refundRes).totalRecords ?? 0;
    const redeemCount = normalizePagination(redeemRes).totalRecords ?? 0;
    const redeemSuccessCount = normalizePagination(redeemSuccessRes).totalRecords ?? 0;
    const activeCount = normalizePagination(activeRes).totalRecords ?? 0;
    const expiredCount = normalizePagination(expiredRes).totalRecords ?? 0;

    summary.order_count = orderCount;
    summary.payment_success_rate = paymentCount ? paymentSuccessCount / paymentCount : 0;
    summary.refund_rate = orderCount ? refundCount / orderCount : 0;
    summary.redeem_success_rate = redeemCount ? redeemSuccessCount / redeemCount : 0;
    summary.active_members = activeCount;
    summary.expired_members = expiredCount;
  } catch (error) {
    const state = resolveRequestError(error, "获取概览失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

// 格式化占比
const formatRate = (value: number) => {
  if (Number.isNaN(value)) return "-";
  return `${(value * 100).toFixed(2)}%`;
};

onMounted(() => {
  fetchSummary();
});
</script>

<style lang="scss" scoped>
.overview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.overview-grid {
  margin-bottom: 12px;
}

.overview-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.overview-card__label {
  color: #909399;
}

.overview-card__value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.overview-skeleton {
  margin-top: 12px;
}
</style>
