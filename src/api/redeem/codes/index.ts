// 兑换码接口
import https from "@/utils/axios.ts";
import type { RedeemCodeListQuery, RedeemCodeVoidRequest } from "./type";

// 获取兑换码列表
export const getRedeemCodeList = (params: RedeemCodeListQuery) => {
  return https.get("/api/admin/redeem/codes", params);
};

// 作废兑换码
export const voidRedeemCode = (codeId: number | string, params: RedeemCodeVoidRequest) => {
  return https.patch(`/api/admin/redeem/codes/${codeId}/void`, params);
};
