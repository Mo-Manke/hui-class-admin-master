// 交易管理路由配置
import { RouteRecordRaw } from "vue-router";
import Layout from "@/layouts/index.vue";

export const adminTradeRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/trade",
    name: "adminTrade",
    component: Layout,
    redirect: "/admin/trade/orders",
    meta: {
      title: "交易管理",
      icon: "ShoppingCart",
      isHide: "1",
      isLink: "",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/admin/trade/orders",
        name: "adminTradeOrders",
        component: () => import("@/views/admin/trade/orders/index.vue"),
        meta: {
          title: "订单管理",
          icon: "List",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/trade/orders/:order_id",
        name: "adminTradeOrderDetail",
        component: () => import("@/views/admin/trade/orders/detail.vue"),
        meta: {
          title: "订单详情",
          icon: "Document",
          isHide: "0",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/admin/trade/orders"
        }
      },
      {
        path: "/admin/trade/payments",
        name: "adminTradePayments",
        component: () => import("@/views/admin/trade/payments/index.vue"),
        meta: {
          title: "支付记录",
          icon: "CreditCard",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/trade/refunds",
        name: "adminTradeRefunds",
        component: () => import("@/views/admin/trade/refunds/index.vue"),
        meta: {
          title: "退款管理",
          icon: "Refresh",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      }
    ]
  }
];
