// 权益定义接口
import https from "@/utils/axios.ts";
import type { EntitlementChangeValueTypeRequest, EntitlementCreateRequest, EntitlementListQuery, EntitlementUpdateRequest } from "./type";

// 获取权益定义列表
export const getEntitlementList = (params: EntitlementListQuery) => {
  return https.get("/api/admin/entitlements", params);
};

// 获取权益定义详情
export const getEntitlementDetail = (id: number | string) => {
  return https.get(`/api/admin/entitlements/${id}`);
};

// 获取权益下拉选项
export const getEntitlementOptions = (valueType?: string) => {
  return https.get("/api/admin/entitlements/options", valueType ? { value_type: valueType } : {});
};

// 创建权益定义
export const createEntitlement = (params: EntitlementCreateRequest) => {
  return https.post("/api/admin/entitlements", params);
};

// 更新权益定义
export const updateEntitlement = (id: number | string, params: EntitlementUpdateRequest) => {
  return https.put(`/api/admin/entitlements/${id}`, params);
};

// 修改权益类型
export const changeEntitlementValueType = (id: number | string, params: EntitlementChangeValueTypeRequest) => {
  return https.put(`/api/admin/entitlements/${id}/value-type`, params);
};
