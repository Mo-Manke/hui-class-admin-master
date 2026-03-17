// 发放记录接口
import https from "@/utils/axios.ts";
import type { DeductGrantRequest, DeductRevertRequest, GrantListQuery, ManualGrantRequest } from "./type";

// 获取发放记录列表
export const getGrantList = (params: GrantListQuery) => {
  return https.get("/api/admin/grants", params);
};

// 手动发放
export const createManualGrant = (params: ManualGrantRequest) => {
  return https.post("/api/admin/grants/manual", params);
};

// 扣减会员时长
export const createDeductGrant = (params: DeductGrantRequest) => {
  return https.post("/api/admin/grants/deduct", params, {
    headers: {
      "Idempotency-Key": params.idempotency_key
    }
  });
};

// 撤销扣减
export const createDeductRevert = (params: DeductRevertRequest) => {
  return https.post("/api/admin/grants/deduct-revert", params, {
    headers: {
      "Idempotency-Key": params.idempotency_key
    }
  });
};
