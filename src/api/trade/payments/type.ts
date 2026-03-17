// 支付记录相关类型定义
export interface PaymentListQuery {
  page?: number;
  limit?: number;
  order_no?: string;
  provider?: string;
  status?: string;
  paidAtFrom?: string;
  paidAtTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

import type { UserSummary } from "@/api/common/types";

export interface PaymentView {
  id: number;
  order_id: number;
  order_no: string;
  user_id?: number | string;
  user?: UserSummary | null;
  provider: string;
  provider_txn_id: string;
  status: string;
  failure_reason?: string | null;
  paid_amount_cent: number;
  currency: string;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw_payload?: string | null;
}
