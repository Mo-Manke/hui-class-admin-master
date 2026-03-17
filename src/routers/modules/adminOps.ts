// 运营与风控路由配置
import { RouteRecordRaw } from "vue-router";
import Layout from "@/layouts/index.vue";

export const adminOpsRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/ops",
    name: "adminOps",
    component: Layout,
    redirect: "/admin/ops/home",
    meta: {
      title: "运营与风控",
      icon: "DataBoard",
      isHide: "1",
      isLink: "",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/admin/ops/home",
        name: "adminOpsHome",
        component: () => import("@/views/admin/ops/home/index.vue"),
        meta: {
          title: "运营概览",
          icon: "Monitor",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/ops/audit",
        name: "adminOpsAudit",
        component: () => import("@/views/admin/ops/audit/index.vue"),
        meta: {
          title: "审计日志",
          icon: "DocumentChecked",
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
