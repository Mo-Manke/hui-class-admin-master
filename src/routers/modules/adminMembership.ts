// 会员体系管理路由配置
import { RouteRecordRaw } from "vue-router";
import Layout from "@/layouts/index.vue";

export const adminMembershipRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/membership",
    name: "adminMembership",
    component: Layout,
    redirect: "/admin/membership/plans",
    meta: {
      title: "会员体系",
      icon: "Postcard",
      isHide: "1",
      isLink: "",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/admin/membership/plans",
        name: "adminMembershipPlans",
        component: () => import("@/views/admin/membership/plans/index.vue"),
        meta: {
          title: "套餐管理",
          icon: "Tickets",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/membership/entitlements",
        name: "adminMembershipEntitlements",
        component: () => import("@/views/admin/membership/entitlements/index.vue"),
        meta: {
          title: "权益管理",
          icon: "Key",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/membership/prices",
        name: "adminMembershipPrices",
        component: () => import("@/views/admin/membership/prices/index.vue"),
        meta: {
          title: "价格管理",
          icon: "Coin",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        },
        children: [
          {
            path: "/admin/membership/prices/plan-entitlements",
            name: "adminMembershipPlanEntitlements",
            component: () => import("@/views/admin/membership/plan-entitlements/index.vue"),
            meta: {
              title: "套餐权益配置",
              icon: "SetUp",
              isHide: "0",
              isLink: "",
              isKeepAlive: "0",
              isFull: "1",
              isAffix: "1",
              activeMenu: "/admin/membership/prices"
            }
          }
        ]
      },
      {
        path: "/admin/membership/prices/:id",
        name: "adminMembershipPriceDetail",
        component: () => import("@/views/admin/membership/prices/detail.vue"),
        meta: {
          title: "价格详情",
          icon: "Coin",
          isHide: "0",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/admin/membership/prices"
        }
      },
      {
        path: "/admin/membership/subscriptions",
        name: "adminMembershipSubscriptions",
        component: () => import("@/views/admin/membership/subscriptions/index.vue"),
        meta: {
          title: "用户订阅",
          icon: "UserFilled",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/membership/grants",
        name: "adminMembershipGrants",
        component: () => import("@/views/admin/membership/grants/index.vue"),
        meta: {
          title: "发放记录",
          icon: "Memo",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/membership/grants/manual",
        name: "adminMembershipGrantsManual",
        component: () => import("@/views/admin/membership/grants/manual.vue"),
        meta: {
          title: "手动发放",
          icon: "Edit",
          isHide: "0",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/admin/membership/grants"
        }
      }
    ]
  }
];
