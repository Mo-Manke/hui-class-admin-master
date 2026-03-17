// 兑换码批次接口
import https from "@/utils/axios.ts";
import type { BatchCreateRequest, BatchListQuery, BatchStatusRequest } from "./type";

// 获取批次列表
export const getBatchList = (params: BatchListQuery) => {
  return https.get("/api/admin/redeem/batches", params);
};

// 创建批次
export const createBatch = (params: BatchCreateRequest) => {
  return https.post("/api/admin/redeem/batches", params);
};

// 更新批次状态
export const updateBatchStatus = (batchId: number | string, params: BatchStatusRequest) => {
  return https.patch(`/api/admin/redeem/batches/${batchId}/status`, params);
};
