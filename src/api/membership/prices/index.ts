// 会员价格接口
import https from "@/utils/axios.ts";
import type { PriceCreateRequest, PriceListQuery, PriceStatusRequest, PriceUpdateRequest } from "./type";

// 获取价格列表
export const getPriceList = (params: PriceListQuery) => {
  return https.get("/api/admin/prices", params);
};

// 获取价格详情
export const getPriceDetail = (id: number | string) => {
  return https.get(`/api/admin/prices/${id}`);
};

// 获取价格下拉选项
export const getPriceOptions = (planId: number, status?: number) => {
  const params = status === undefined ? { plan_id: planId } : { plan_id: planId, status };
  return https.get("/api/admin/prices/options", params);
};

// 创建价格
export const createPrice = (params: PriceCreateRequest) => {
  return https.post("/api/admin/prices", params);
};

// 更新价格
export const updatePrice = (id: number | string, params: PriceUpdateRequest) => {
  return https.put(`/api/admin/prices/${id}`, params);
};

// 启用/禁用价格
export const updatePriceStatus = (id: number | string, params: PriceStatusRequest) => {
  return https.patch(`/api/admin/prices/${id}/status`, params);
};
