// 权益定义相关类型
export interface EntitlementListQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  value_type?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface EntitlementCreateRequest {
  entitlement_key: string;
  name: string;
  sub_title: string;
  non_member_display_text?: string | null;
  is_new?: boolean | null;
  value_type: string;
  icon?: string | null;
  sort?: number | null;
  remark?: string | null;
  idempotency_key?: string | null;
}

export interface EntitlementUpdateRequest {
  name?: string | null;
  sub_title?: string | null;
  non_member_display_text?: string | null;
  is_new?: boolean | null;
  icon?: string | null;
  sort?: number | null;
  remark?: string | null;
  updatedAt?: string | null;
}

export interface EntitlementView {
  id: number;
  entitlement_key: string;
  name: string;
  sub_title: string;
  non_member_display_text?: string | null;
  is_new?: boolean | null;
  value_type: string;
  icon?: string | null;
  sort?: number | null;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementOption {
  id: number;
  entitlement_key: string;
  name: string;
  value_type: string;
}

export interface EntitlementChangeValueTypeRequest {
  value_type: string;
  new_default_value: string;
  updatedAt?: string | null;
}

export interface EntitlementChangeValueTypeResult {
  updatedPlans: number;
  updatedRows: number;
}
