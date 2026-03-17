// 会员套餐接口
import https from "@/utils/axios.ts";
import type { PlanCreateRequest, PlanListQuery, PlanOptionQuery, PlanStatusRequest, PlanUpdateRequest } from "./type";

// 获取套餐列表
export const getPlanList = (params: PlanListQuery) => {
  return https.get("/api/admin/plans", params);
};

// 获取套餐详情
export const getPlanDetail = (id: number | string) => {
  return https.get(`/api/admin/plans/${id}`);
};

// 获取套餐下拉选项
export const getPlanOptions = (params: PlanOptionQuery = { exclude_free: true }) => {
  return https.get("/api/admin/plans/options", params);
};

// 创建套餐
export const createPlan = (params: PlanCreateRequest) => {
  return https.post("/api/admin/plans", params);
};

// 更新套餐
export const updatePlan = (id: number | string, params: PlanUpdateRequest) => {
  return https.put(`/api/admin/plans/${id}`, params);
};

// 启用/禁用套餐
export const updatePlanStatus = (id: number | string, params: PlanStatusRequest) => {
  return https.patch(`/api/admin/plans/${id}/status`, params);
};
