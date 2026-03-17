// 会员套餐相关类型定义
export interface PlanListQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string | number;
  sort_by?: string;
  sort_order?: string;
}

export interface PlanCreateRequest {
  plan_code: string;
  plan_name: string;
  plan_level: number;
  status?: number | null;
  remark?: string | null;
  idempotency_key?: string | null;
}

export interface PlanUpdateRequest {
  plan_name?: string | null;
  plan_level?: number | null;
  remark?: string | null;
  updatedAt?: string | null;
}

export interface PlanStatusRequest {
  status: number;
  reason?: string | null;
}

export interface PlanView {
  id: number;
  plan_code: string;
  plan_name: string;
  plan_level: number;
  status: number;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanOption {
  id: number;
  plan_code: string;
  plan_name: string;
}

export interface PlanOptionQuery {
  status?: number | string;
  exclude_free?: boolean;
}
