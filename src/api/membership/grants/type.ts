// 发放记录相关类型定义
export interface GrantListQuery {
  page?: number;
  limit?: number;
  user_id?: string;
  action_type?: string;
  source_type?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

import type { UserSummary } from "@/api/common/types";

export interface GrantView {
  id: number;
  user_id: number | string;
  user?: UserSummary | null;
  action_type: string;
  plan_id: number;
  days_delta: number;
  startAt?: string | null;
  endAt?: string | null;
  source_type?: string | null;
  source_id?: number | string | null;
  remark?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ManualGrantRequest {
  user_id: number;
  plan_id: number;
  days_delta: number;
  startAt?: string | null;
  remark?: string | null;
  idempotency_key?: string | null;
}

export interface DeductGrantRequest {
  user_id: number;
  plan_id: number;
  days_delta: number;
  remark?: string | null;
  idempotency_key: string;
}

export interface DeductRevertRequest {
  grant_id: number;
  remark?: string | null;
  idempotency_key: string;
}
