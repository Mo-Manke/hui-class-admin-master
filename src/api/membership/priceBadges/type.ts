// 价格标签类型
export interface PriceBadgeListQuery {
  page?: number;
  limit?: number;
  price_id?: string | number;
  status?: string | number;
  badge_type?: string;
  position?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface PriceBadgeCreateRequest {
  price_id: number;
  badge_text: string;
  badge_type?: string | null;
  position?: string | null;
  sort?: number | null;
  status?: number | null;
  startAt?: string | null;
  endAt?: string | null;
}

export interface PriceBadgeUpdateRequest {
  badge_text?: string | null;
  badge_type?: string | null;
  position?: string | null;
  sort?: number | null;
  status?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  updatedAt?: string | null;
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
