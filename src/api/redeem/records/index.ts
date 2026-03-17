// 兑换记录接口
import https from "@/utils/axios.ts";
import type { RedeemRecordListQuery } from "./type";

// 获取兑换记录列表
export const getRedeemRecordList = (params: RedeemRecordListQuery) => {
  return https.get("/api/admin/redeem/records", params);
};
