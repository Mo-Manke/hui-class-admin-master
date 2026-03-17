// 用户订阅接口
import https from "@/utils/axios.ts";
import type { SubscriptionListQuery } from "./type";

// 获取用户订阅列表
export const getSubscriptionList = (params: SubscriptionListQuery) => {
  return https.get("/api/admin/subscriptions", params);
};
