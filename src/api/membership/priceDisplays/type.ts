// 价格展示配置类型
export interface PriceDisplayListQuery {
  page?: number;
  limit?: number;
  price_id?: string | number;
  status?: string | number;
  sort_by?: string;
  sort_order?: string;
}

export interface PriceDisplayCreateRequest {
  price_id: number;
  display_name: string;
  bottom_text?: string | null;
  sub_text?: string | null;
  status?: number | null;
  startAt?: string | null;
  endAt?: string | null;
}

export interface PriceDisplayUpdateRequest {
  display_name?: string | null;
  bottom_text?: string | null;
  sub_text?: string | null;
  status?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  updatedAt?: string | null;
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
