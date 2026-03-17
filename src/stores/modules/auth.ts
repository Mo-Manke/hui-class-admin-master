import { defineStore } from "pinia";
import { staticRouter } from "@/routers/modules/staticRouter";
import type { UserInfo } from "@/stores/interface";
import { getUserInfo } from "@/api/system/user";
import { getAllBreadcrumbList, getShowStaticAndDynamicMenuList } from "@/utils/index.ts";

const cloneRoutes = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const flattenRoutes = (routes: any[] = []): any[] =>
  routes.flatMap(route => {
    const { children, ...currentRoute } = route;
    const nextChildren = children ? flattenRoutes(children) : [];
    return [currentRoute, ...nextChildren];
  });

const useAuthStore = defineStore("auth", {
  state: () => ({
    menuList: flattenRoutes(cloneRoutes(staticRouter)),
    recursiveMenuList: getShowStaticAndDynamicMenuList(cloneRoutes(staticRouter)),
    breadcrumbList: cloneRoutes(staticRouter),
    userInfo: null as UserInfo | null,
    buttonList: ["*"] as string[]
  }),
  actions: {
    async listRouters() {
      this.menuList = flattenRoutes(cloneRoutes(staticRouter));
      this.recursiveMenuList = getShowStaticAndDynamicMenuList(cloneRoutes(staticRouter));
      this.breadcrumbList = cloneRoutes(staticRouter);
    },
    async getLoginUserInfo() {
      if (!this.userInfo) {
        const userInfo = (await getUserInfo()).data;
        this.userInfo = userInfo;
      }
      return this.userInfo;
    },
    setLoginUserInfo(userInfo: UserInfo | null) {
      this.userInfo = userInfo;
    }
  },
  getters: {
    getMenuList: state => state.menuList,
    showMenuList: state => state.recursiveMenuList,
    getBreadcrumbList: state => getAllBreadcrumbList(state.breadcrumbList)
  }
});

export default useAuthStore;
