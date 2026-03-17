// 订单接口
import https from "@/utils/axios.ts";
import type { OrderCancelRequest, OrderDetailView, OrderListQuery, OrderRefundRequest } from "./type";

// 获取订单列表
export const getOrderList = (params: OrderListQuery) => {
  return https.get("/api/admin/orders", params);
};

// 获取订单详情
export const getOrderDetail = (orderId: number | string) => {
  return https.get(`/api/admin/orders/${orderId}`) as Promise<{ data: OrderDetailView }>;
};

// 取消订单
export const cancelOrder = (orderId: number | string, params: OrderCancelRequest) => {
  return https.patch(`/api/admin/orders/${orderId}/cancel`, params);
};

// 发起退款
export const createOrderRefund = (orderId: number | string, params: OrderRefundRequest) => {
  return https.post(`/api/admin/orders/${orderId}/refunds`, params);
};
