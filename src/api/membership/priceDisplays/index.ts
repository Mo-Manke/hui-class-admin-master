// 价格展示配置接口
import https from "@/utils/axios.ts";
import type { PriceDisplayCreateRequest, PriceDisplayListQuery, PriceDisplayUpdateRequest } from "./type";

// 获取展示配置列表
export const getPriceDisplayList = (params: PriceDisplayListQuery) => {
  return https.get("/api/admin/price-displays", params);
};

// 获取展示配置详情
export const getPriceDisplayDetail = (id: number | string) => {
  return https.get(`/api/admin/price-displays/${id}`);
};

// 创建展示配置
export const createPriceDisplay = (params: PriceDisplayCreateRequest) => {
  return https.post("/api/admin/price-displays", params);
};

// 更新展示配置
export const updatePriceDisplay = (id: number | string, params: PriceDisplayUpdateRequest) => {
  return https.put(`/api/admin/price-displays/${id}`, params);
};

// 删除展示配置
export const deletePriceDisplay = (id: number | string) => {
  return https.delete(`/api/admin/price-displays/${id}`);
};
