import type { RouteRecordRaw } from "vue-router";
import { HOME_URL, LOGIN_URL } from "@/config";
import Layout from "@/layouts/index.vue";

export const layoutRouter: RouteRecordRaw[] = [
  {
    path: "/",
    name: "layout",
    component: Layout,
    redirect: HOME_URL,
    children: [
      {
        path: HOME_URL,
        name: "dashboard",
        component: () => import("@/views/home/index.vue"),
        meta: {
          title: "主控台",
          icon: "HomeFilled",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "0"
        }
      },
      {
        path: "/app-users",
        name: "appUsers",
        component: () => import("@/views/appUser/index.vue"),
        meta: {
          title: "用户管理",
          icon: "User",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/system/essential",
        name: "legacySystemEssential",
        redirect: "/essential",
        meta: {
          title: "配置管理",
          isHide: "0",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/system/schedule-import",
        name: "legacyScheduleImport",
        redirect: "/schedule-import",
        meta: {
          title: "课表抓取",
          isHide: "0",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/system/personage",
        name: "legacySystemPersonage",
        redirect: "/personage",
        meta: {
          title: "个人中心",
          isHide: "0",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/swiper/type",
        name: "legacySwiperType",
        redirect: "/swiper-type",
        meta: {
          title: "轮播图分类",
          isHide: "0",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/swiper/image",
        name: "legacySwiperImage",
        redirect: "/swiper-image",
        meta: {
          title: "轮播图列表",
          isHide: "0",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1"
        }
      }
    ]
  },
  {
    path: LOGIN_URL,
    name: "login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录"
    }
  }
];

export const staticRouter: RouteRecordRaw[] = [
  {
    path: HOME_URL,
    name: "dashboardStatic",
    component: () => import("@/views/home/index.vue"),
    meta: {
      title: "主控台",
      icon: "HomeFilled",
      isHide: "1",
      isLink: "",
      isKeepAlive: "1",
      isFull: "1",
      isAffix: "0"
    }
  },
  {
    path: "/app-users",
    name: "appUsersStatic",
    component: () => import("@/views/appUser/index.vue"),
    meta: {
      title: "用户管理",
      icon: "User",
      isHide: "1",
      isLink: "",
      isKeepAlive: "1",
      isFull: "1",
      isAffix: "1"
    }
  },
  {
    path: "/swiper",
    name: "swiper",
    component: Layout,
    redirect: "/swiper-type",
    meta: {
      title: "轮播图管理",
      icon: "Picture",
      isHide: "1",
      isLink: "",
      isKeepAlive: "1",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/swiper-type",
        name: "swiperType",
        component: () => import("@/views/swiper/swiperType.vue"),
        meta: {
          title: "轮播图分类",
          icon: "Files",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/swiper"
        }
      },
      {
        path: "/swiper-image",
        name: "swiperImage",
        component: () => import("@/views/swiper/index.vue"),
        meta: {
          title: "轮播图列表",
          icon: "PictureFilled",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/swiper"
        }
      }
    ]
  },
  {
    path: "/system",
    name: "system",
    component: Layout,
    redirect: "/essential",
    meta: {
      title: "系统设置",
      icon: "Tools",
      isHide: "1",
      isLink: "",
      isKeepAlive: "1",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/essential",
        name: "systemEssential",
        component: () => import("@/views/system/essential/index.vue"),
        meta: {
          title: "配置管理",
          icon: "Tools",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/system"
        }
      },
      {
        path: "/schedule-import",
        name: "scheduleImport",
        component: () => import("@/views/system/scheduleImport/index.vue"),
        meta: {
          title: "课表抓取",
          icon: "Upload",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/system"
        }
      },
      {
        path: "/personage",
        name: "systemPersonage",
        component: () => import("@/views/system/personage/index.vue"),
        meta: {
          title: "个人中心",
          icon: "UserFilled",
          isHide: "1",
          isLink: "",
          isKeepAlive: "1",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/system"
        }
      }
    ]
  }
];

export const errorRouter: RouteRecordRaw[] = [
  {
    path: "/403",
    name: "403",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: "403页面",
      icon: "QuestionFilled",
      isHide: "1",
      isLink: "1",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    }
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/error/404.vue"),
    meta: {
      title: "404页面",
      icon: "CircleCloseFilled",
      isHide: "1",
      isLink: "1",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    }
  },
  {
    path: "/500",
    name: "500",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: "500页面",
      icon: "WarningFilled",
      isHide: "1",
      isLink: "1",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    }
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/error/404.vue")
  }
];
