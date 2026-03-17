// 支付记录接口
import https from "@/utils/axios.ts";
import type { PaymentListQuery } from "./type";

// 获取支付列表
export const getPaymentList = (params: PaymentListQuery) => {
  return https.get("/api/admin/payments", params);
};
