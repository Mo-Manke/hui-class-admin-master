import { defineStore } from "pinia";
import { PINIA_PREFIX, HOME_URL } from "@/config/index.ts";
import router from "@/routers/index.ts";
import { getUrlWithParams } from "@/utils/index.ts";
import { koiMsgWarning } from "@/utils/koi.ts";
import useKeepAliveStore from "@/stores/modules/keepAlive.ts";

const normalizePath = (path: string) => path.split("?")[0].split("#")[0];

const flattenLeafRoutes = (routes: any[] = []): any[] =>
  routes.flatMap(item => {
    if (item.children?.length) return flattenLeafRoutes(item.children);
    return item?.path ? [item] : [];
  });

const tabsStore = defineStore("tabs", {
  persist: {
    key: PINIA_PREFIX + "tabs",
    storage: localStorage
  },
  state: () => ({
    tabList: [] as any[]
  }),
  actions: {
    async syncWithRoutes(routes: any[] = []) {
      const keepAliveStore = useKeepAliveStore();
      const leafRoutes = flattenLeafRoutes(routes);
      const leafRouteMap = new Map(leafRoutes.map(item => [item.path, item]));

      this.tabList = this.tabList
        .filter((item: any) => leafRouteMap.has(normalizePath(item.path)))
        .map((item: any) => {
          const basePath = normalizePath(item.path);
          const route = leafRouteMap.get(basePath);
          const isHome = basePath === HOME_URL;
          return {
            ...item,
            icon: route?.meta?.icon ?? item.icon,
            title: route?.meta?.title ?? item.title,
            name: route?.name ?? item.name,
            isKeepAlive: route?.meta?.isKeepAlive ?? item.isKeepAlive,
            closeIcon: isHome ? false : route?.meta?.isAffix == "1"
          };
        });

      keepAliveStore.setKeepAliveName(
        this.tabList.filter((item: any) => item.isKeepAlive == "0" && item.name).map((item: any) => item.name)
      );
    },
    async addTab(tab: any, routes: any[] = []) {
      const keepAliveStore = useKeepAliveStore();
      const basePath = normalizePath(tab.path);
      if (routes.length) {
        const leafRouteMap = new Map(flattenLeafRoutes(routes).map(item => [item.path, item]));
        if (!leafRouteMap.has(basePath)) return;
      }

      const isTab = this.tabList.some((item: any) => item.path === tab.path);
      if (isTab) return;

      if (!keepAliveStore.keepAliveName.includes(tab.name) && tab.isKeepAlive == "0" && tab.name) {
        keepAliveStore.addKeepAliveName(tab.name);
      }
      this.tabList.push(tab);
    },
    async removeTab(tabPath: string, isCurrent: boolean = true, selectedPath?: string) {
      if (tabPath == HOME_URL) {
        koiMsgWarning("首页禁止关闭");
        return;
      }

      const keepAliveStore = useKeepAliveStore();
      const tabItem = this.tabList.find(item => item.path === tabPath);
      if (tabItem?.isKeepAlive == "0" && tabItem?.name) {
        keepAliveStore.removeKeepAliveName(tabItem.name);
      }

      const oldTabList = [...this.tabList];
      this.tabList = this.tabList.filter(item => item.path !== tabPath);

      if (!isCurrent) return;

      const matchingPathObject = this.tabList.find((item: any) => item.path == selectedPath);
      if (matchingPathObject) {
        router.push(matchingPathObject.path || HOME_URL);
        return;
      }

      oldTabList.forEach((item, index) => {
        if (item.path !== tabPath) return;
        const nextTab = oldTabList[index + 1] || oldTabList[index - 1];
        if (!nextTab) return;
        router.push(nextTab.path);
      });
    },
    async setTab(tabList: any[]) {
      this.tabList = tabList;
    },
    async setTabTitle(title: string) {
      this.tabList.forEach(item => {
        if (item.path == getUrlWithParams()) item.title = title;
      });
    },
    async closeSideTabs(path: string, type: "left" | "right") {
      const keepAliveStore = useKeepAliveStore();
      const currentIndex = this.tabList.findIndex(item => item.path === path);
      if (currentIndex !== -1) {
        const range = type === "left" ? [0, currentIndex] : [currentIndex + 1, this.tabList.length];
        this.tabList = this.tabList.filter((item, index) => index < range[0] || index >= range[1] || !item.closeIcon);

        const fixedTabs = this.tabList.filter((item: any) => !item.closeIcon);
        if (type === "left") {
          const nextTab = this.tabList[fixedTabs.length];
          router.push(nextTab?.path || HOME_URL);
        }

        if (type === "right") {
          const nextTab = this.tabList[currentIndex] || this.tabList[currentIndex + 1] || this.tabList[currentIndex - 1];
          router.push(nextTab?.path || HOME_URL);
        }
      }

      keepAliveStore.setKeepAliveName(
        this.tabList.filter((item: any) => item.isKeepAlive == "0" && item.name).map((item: any) => item.name)
      );
    },
    async closeManyTabs(tabValue?: string) {
      const keepAliveStore = useKeepAliveStore();
      this.tabList = this.tabList.filter(item => item.path === tabValue || !item.closeIcon);
      keepAliveStore.setKeepAliveName(
        this.tabList.filter((item: any) => item.isKeepAlive == "0" && item.name).map((item: any) => item.name)
      );
    },
    async replaceIsAffix(tabPath?: string, closeIcon?: boolean) {
      this.tabList.forEach(item => {
        if (item.path == tabPath) {
          item.closeIcon = closeIcon;
        }
      });
    }
  },
  getters: {
    getTabs(state) {
      return state.tabList;
    }
  }
});

export default tabsStore;
