// 退款接口
import https from "@/utils/axios.ts";
import type { RefundListQuery } from "./type";

// 获取退款列表
export const getRefundList = (params: RefundListQuery) => {
  return https.get("/api/admin/refunds", params);
};
