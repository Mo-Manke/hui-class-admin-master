// 会员价格相关类型
export interface PriceListQuery {
  page?: number;
  limit?: number;
  plan_id?: string | number;
  channel?: string;
  status?: string | number;
  duration_days?: string | number;
  keyword?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface PriceCreateRequest {
  plan_id: number;
  duration_days: number;
  currency: string;
  channel: string;
  list_price_cent: number;
  sale_price_cent?: number | null;
  status?: number | null;
  remark?: string | null;
  idempotency_key?: string | null;
}

export interface PriceUpdateRequest {
  duration_days?: number | null;
  currency?: string | null;
  channel?: string | null;
  list_price_cent?: number | null;
  sale_price_cent?: number | null;
  remark?: string | null;
  updatedAt?: string | null;
}

export interface PriceStatusRequest {
  status: number;
  reason?: string | null;
}

export interface PriceView {
  id: number;
  plan_id: number;
  duration_days: number;
  currency: string;
  channel: string;
  list_price_cent: number;
  sale_price_cent?: number | null;
  status: number;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
  display?: PriceDisplayView | null;
  badges?: PriceBadgeView[];
}

export interface PriceOption {
  id: number;
  duration_days: number;
  currency: string;
  channel: string;
}

export interface PriceDisplayView {
  id: number;
  price_id: number;
  display_name: string;
  bottom_text?: string | null;
  sub_text?: string | null;
  status: number;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceBadgeView {
  id: number;
  price_id: number;
  badge_text: string;
  badge_type: string;
  position: string;
  sort: number;
  status: number;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
