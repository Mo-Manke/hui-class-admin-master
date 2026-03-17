// 套餐权益配置相关类型
export interface PlanEntitlementQuery {
  plan_id: number;
}

export interface PlanEntitlementItem {
  entitlement_key: string;
  name: string;
  value_type: string;
  raw_value?: string | null;
  value?: unknown;
  updatedAt?: string | null;
}

export interface PlanEntitlementSaveItem {
  entitlement_key: string;
  entitlement_value: string;
  updatedAt: string;
}

export interface PlanEntitlementSaveRequest {
  plan_id: number;
  items: PlanEntitlementSaveItem[];
}
