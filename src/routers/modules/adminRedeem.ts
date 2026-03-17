// 兑换码体系路由配置
import { RouteRecordRaw } from "vue-router";
import Layout from "@/layouts/index.vue";

export const adminRedeemRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/redeem",
    name: "adminRedeem",
    component: Layout,
    redirect: "/admin/redeem/batches",
    meta: {
      title: "兑换码体系",
      icon: "Ticket",
      isHide: "1",
      isLink: "",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/admin/redeem/batches",
        name: "adminRedeemBatches",
        component: () => import("@/views/admin/redeem/batches/index.vue"),
        meta: {
          title: "批次管理",
          icon: "Collection",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/redeem/codes",
        name: "adminRedeemCodes",
        component: () => import("@/views/admin/redeem/codes/index.vue"),
        meta: {
          title: "兑换码管理",
          icon: "Connection",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/redeem/records",
        name: "adminRedeemRecords",
        component: () => import("@/views/admin/redeem/records/index.vue"),
        meta: {
          title: "兑换记录",
          icon: "Document",
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
