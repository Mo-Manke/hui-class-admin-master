// 兑换记录相关类型定义
export interface RedeemRecordListQuery {
  page?: number;
  limit?: number;
  user_id?: string;
  code?: string;
  batch_no?: string;
  status?: string;
  redeemedAtFrom?: string;
  redeemedAtTo?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface RedeemRecordView {
  id: number;
  user_id: string;
  app_user?: {
    id: number;
    nickname?: string | null;
    avatar?: string | null;
  } | null;
  redeem_code_id: number;
  code: string;
  batch_id: number;
  batch_no?: string | null;
  plan_id: number;
  duration_days: number;
  status: string;
  fail_reason?: string | null;
  redeemedAt?: string | null;
}
