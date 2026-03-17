// 价格标签接口
import https from "@/utils/axios.ts";
import type { PriceBadgeCreateRequest, PriceBadgeListQuery, PriceBadgeUpdateRequest } from "./type";

// 获取标签列表
export const getPriceBadgeList = (params: PriceBadgeListQuery) => {
  return https.get("/api/admin/price-badges", params);
};

// 获取标签详情
export const getPriceBadgeDetail = (id: number | string) => {
  return https.get(`/api/admin/price-badges/${id}`);
};

// 创建标签
export const createPriceBadge = (params: PriceBadgeCreateRequest) => {
  return https.post("/api/admin/price-badges", params);
};

// 更新标签
export const updatePriceBadge = (id: number | string, params: PriceBadgeUpdateRequest) => {
  return https.put(`/api/admin/price-badges/${id}`, params);
};

// 删除标签
export const deletePriceBadge = (id: number | string) => {
  return https.delete(`/api/admin/price-badges/${id}`);
};
