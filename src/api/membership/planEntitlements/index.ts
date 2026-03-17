// 套餐权益配置接口
import https from "@/utils/axios.ts";
import type { PlanEntitlementQuery, PlanEntitlementSaveRequest } from "./type";

// 查询套餐权益配置
export const getPlanEntitlements = (params: PlanEntitlementQuery) => {
  return https.get("/api/admin/plan-entitlements", params);
};

// 保存套餐权益配置
export const savePlanEntitlements = (params: PlanEntitlementSaveRequest) => {
  const { plan_id, ...payload } = params;
  return https.put("/api/admin/plan-entitlements?plan_id=" + plan_id, payload);
};
