// 退款相关类型定义
export interface RefundListQuery {
  page?: number;
  limit?: number;
  refund_no?: string;
  order_no?: string;
  status?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  successAtFrom?: string;
  successAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

import type { UserSummary } from "@/api/common/types";

export interface RefundView {
  id: number;
  order_id: number;
  order_no: string;
  user_id: number | string;
  user?: UserSummary | null;
  refund_no: string;
  refund_amount_cent: number;
  currency: string;
  status: string;
  failure_reason?: string | null;
  reason?: string | null;
  provider?: string | null;
  provider_refund_id?: string | null;
  created_by?: number | null;
  created_by_user?: UserSummary | null;
  createdAt?: string | null;
  successAt?: string | null;
  updatedAt?: string | null;
}
