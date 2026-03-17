// 曲谱识别（OMR）管理路由配置
import { RouteRecordRaw } from "vue-router";
import Layout from "@/layouts/index.vue";

export const adminOmrRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/omr",
    name: "adminOmr",
    component: Layout,
    redirect: "/admin/omr/overview",
    meta: {
      title: "曲谱识别",
      icon: "Camera",
      isHide: "1",
      isLink: "",
      isKeepAlive: "0",
      isFull: "1",
      isAffix: "1"
    },
    children: [
      {
        path: "/admin/omr/overview",
        name: "adminOmrOverview",
        component: () => import("@/views/admin/omr/overview/index.vue"),
        meta: {
          title: "概览/运维",
          icon: "DataLine",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/omr/user-tasks",
        name: "adminOmrUserTasks",
        component: () => import("@/views/admin/omr/user-tasks/index.vue"),
        meta: {
          title: "用户任务",
          icon: "List",
          isHide: "1",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1"
        }
      },
      {
        path: "/admin/omr/tasks/:taskId",
        name: "adminOmrTaskDetail",
        component: () => import("@/views/admin/omr/tasks/detail.vue"),
        meta: {
          title: "任务详情",
          icon: "Document",
          isHide: "0",
          isLink: "",
          isKeepAlive: "0",
          isFull: "1",
          isAffix: "1",
          activeMenu: "/admin/omr/user-tasks"
        }
      }
    ]
  }
];

