// 兑换码相关类型定义
export interface RedeemCodeListQuery {
  page?: number;
  limit?: number;
  code?: string;
  batch_no?: string;
  status?: string;
  used_by_user_id?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface RedeemCodeView {
  id: number;
  code: string;
  batch_id: number;
  batch_no?: string | null;
  status: string;
  used_by_user_id?: string | null;
  used_by_user?: {
    id: number;
    nickname?: string | null;
    username?: string | null;
    avatar?: string | null;
  } | null;
  usedAt?: string | null;
  createdAt?: string | null;
}

export interface RedeemCodeVoidRequest {
  reason?: string | null;
}
