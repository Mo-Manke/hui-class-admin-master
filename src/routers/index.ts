import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { errorRouter, layoutRouter, staticRouter } from "@/routers/modules/staticRouter";
import nprogress from "@/utils/nprogress";
import { LOGIN_URL, ROUTER_WHITE_LIST } from "@/config";
import useAuthStore from "@/stores/modules/auth";
import useUserStore from "@/stores/modules/user";

const mode = import.meta.env.VITE_ROUTER_MODE;

const routerMode: Record<string, () => ReturnType<typeof createWebHashHistory>> = {
  hash: () => createWebHashHistory(),
  history: () => createWebHistory()
};

const router = createRouter({
  history: (routerMode[mode] || routerMode.hash)(),
  routes: [...layoutRouter, ...staticRouter, ...errorRouter],
  strict: false,
  scrollBehavior() {
    return { left: 0, top: 0 };
  }
});

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  nprogress.start();

  document.title = String(to.meta.title || import.meta.env.VITE_WEB_TITLE || "课表后台");

  if (to.path === LOGIN_URL) {
    if (userStore.token) {
      next({ path: "/" });
      return;
    }
    next();
    return;
  }

  if (ROUTER_WHITE_LIST.includes(to.path)) {
    next();
    return;
  }

  if (!userStore.token) {
    next({ path: LOGIN_URL, replace: true });
    return;
  }

  if (!authStore.getMenuList.length) {
    await authStore.listRouters();
  }

  next();
});

router.afterEach(() => {
  nprogress.done();
});

router.onError(error => {
  nprogress.done();
  console.warn("router error", error);
});

export const resetRouter = () => undefined;

export default router;
