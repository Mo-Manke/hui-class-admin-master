import { UserSummary } from "@/api/common/types";

// 订单相关类型定义
export interface OrderListQuery {
  page?: number;
  limit?: number;
  order_no?: string;
  user_id?: string;
  status?: string | string[];
  channel?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  paidAtFrom?: string;
  paidAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface OrderView {
  id: number;
  order_no: string;
  user_id: number | string;
  user?: UserSummary | null;
  status: string;
  refund_status?: string | null;
  refund_failure_reason?: string | null;
  currency: string;
  total_amount_cent: number;
  channel: string;
  createdAt: string;
  updatedAt?: string | null;
  paidAt?: string | null;
}

export interface OrderItemView {
  id: number;
  plan_id: number;
  price_id: number;
  duration_days: number;
  list_price_cent: number;
  final_price_cent: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrderPaymentView {
  id: number;
  provider: string;
  provider_txn_id: string;
  status: string;
  failure_reason?: string | null;
  paid_amount_cent: number;
  currency: string;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrderRefundView {
  id: number;
  refund_no: string;
  refund_amount_cent: number;
  currency?: string | null;
  status: string;
  failure_reason?: string | null;
  reason?: string | null;
  provider?: string | null;
  provider_refund_id?: string | null;
  created_by?: number | null;
  createdAt?: string | null;
  successAt?: string | null;
  updatedAt?: string | null;
}

export interface OrderDetailView {
  order: OrderView;
  items: OrderItemView[];
  payment?: OrderPaymentView | null;
  refunds: OrderRefundView[];
  idempotency_key?: string | null;
}

export interface OrderCancelRequest {
  reason?: string | null;
  idempotency_key?: string | null;
}

export interface OrderRefundRequest {
  refund_amount_cent?: number | null;
  reason?: string | null;
  idempotency_key?: string | null;
}
