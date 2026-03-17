// 用户订阅相关类型定义
export interface SubscriptionListQuery {
  page?: number;
  limit?: number;
  user_id?: string;
  status?: string;
  plan_id?: number | string;
  expireAtFrom?: string;
  expireAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface SubscriptionView {
  user_id: number | string;
  user?: {
    id: number;
    nickname?: string | null;
    avatar?: string | null;
  } | null;
  plan_id: number;
  plan_code?: string | null;
  plan_name?: string | null;
  status: string;
  startAt?: string | null;
  expireAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
