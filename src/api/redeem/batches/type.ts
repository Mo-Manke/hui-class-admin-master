// 兑换码批次相关类型定义
export interface BatchListQuery {
  page?: number;
  limit?: number;
  batch_no?: string;
  name?: string;
  plan_id?: number | string;
  status?: number | string;
  createdAtFrom?: string;
  createdAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

import type { UserSummary } from "@/api/common/types";

export interface BatchView {
  id: number;
  batch_no: string;
  name: string;
  plan_id: number;
  plan_name?: string | null;
  duration_days: number;
  total_count: number;
  effective_from?: string | null;
  effective_to?: string | null;
  status: number;
  created_by?: string | null;
  created_by_user?: UserSummary | null;
  createdAt?: string | null;
}

export interface BatchCreateRequest {
  batch_no?: string | null;
  name: string;
  plan_id: number;
  duration_days: number;
  total_count: number;
  effective_from?: string | null;
  effective_to?: string | null;
  status?: number | null;
}

export interface BatchStatusRequest {
  status: number;
}
