<template>
  <el-container class="layout-container">
    <el-aside
      v-if="subMenuList.length !== 0"
      class="layout-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : settings.columnMenuCollapseWidth }"
    >
      <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout" />
      <el-scrollbar class="layout-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="globalStore.isCollapse"
          :collapse-transition="false"
          :uniqueOpened="globalStore.uniqueOpened"
          :router="false"
          :class="menuAnimate"
        >
          <ColumnSubMenu :menuList="subMenuList" />
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header">
          <div class="header-left">
            <Collapse />
            <div class="layout-row ml-18px">
              <el-scrollbar>
                <div class="flex flex-wrap">
                  <div
                    v-for="item in menuList"
                    :key="item.path"
                    class="left-row"
                    :class="{ 'is-active': columnActive === item.path || `/${columnActive.split('/')[1]}` === item.path }"
                    @click="handleSubMenu(item)"
                  >
                    <KoiGlobalIcon v-if="item.meta?.icon" :name="item.meta.icon" size="18" />
                    <span class="title">{{ item.meta?.title }}</span>
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </div>
          <Toolbar />
        </div>
      </el-header>
      <Main />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import settings from "@/settings.ts";
import Logo from "@/layouts/components/Logo/index.vue";
import Collapse from "@/layouts/components/Header/components/Collapse.vue";
import Toolbar from "@/layouts/components/Header/components/Toolbar.vue";
import ColumnSubMenu from "@/layouts/components/Menu/ColumnSubMenu.vue";
import Main from "@/layouts/components/Main/index.vue";
import useAuthStore from "@/stores/modules/auth.ts";
import useGlobalStore from "@/stores/modules/global.ts";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

const menuAnimate = ref(settings.menuAnimate);
const menuList = computed(() => authStore.showMenuList.filter((item: any) => item.meta?.isHide == "1"));
const columnActive = ref("");
const subMenuList = ref<any[]>([]);

watch(
  () => [menuList.value, route.path],
  () => {
    if (!menuList.value.length) return;
    columnActive.value = route.path;
    const menuItem = menuList.value.filter((item: any) => route.path === item.path || `/${route.path.split("/")[1]}` === item.path);
    if (!menuItem[0]?.children?.length) {
      subMenuList.value = [];
      return;
    }
    subMenuList.value = menuItem[0].children;
  },
  { deep: true, immediate: true }
);

const handleSubMenu = (item: any) => {
  columnActive.value = item.path;
  if (item.children?.length) {
    subMenuList.value = item.children;
    return;
  }
  subMenuList.value = [];
  router.push(item.path);
};

const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
const rowMenuColor = computed(() => {
  if (globalStore.asideInverted && globalStore.headerInverted) return "white";
  if (globalStore.asideInverted) return "black";
  if (globalStore.headerInverted) return "white";
  return "black";
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  height: $aside-header-height;

  .header-left {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
  }
}

.layout-row {
  display: flex;
  height: 100%;
  user-select: none;
  background-color: var(--el-header-bg-color);

  .left-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 48px;
    margin: $aside-menu-padding-left;
    cursor: pointer;
    border: rgba(0, 0, 0, 0) solid 2px;
    color: v-bind(rowMenuColor);

    @apply dark:text-#E5E3EA;

    .title {
      margin-top: 8px;
      font-size: 12px;
      font-weight: $aside-menu-font-weight;
      line-height: 14px;
      text-align: center;
      letter-spacing: 2px;
    }

    &:hover {
      color: var(--el-menu-hover-text-color);
      background: var(--el-menu-hover-bg-color);
      border: 2px dashed var(--el-menu-border-left-color);
      border-radius: 4px;
    }

    &.is-active {
      color: var(--el-menu-hover-text-color);
      background: var(--el-menu-active-bg-color);
      border: 2px dashed var(--el-menu-border-left-color);
      border-radius: 4px;
    }
  }
}

.layout-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .layout-aside {
    z-index: $layout-aside-z-index;
    padding-right: $column-menu-padding-right;
    padding-left: $column-menu-padding-left;
    background-color: var(--el-menu-bg-color);
    border-right: none;
    box-shadow: $aside-menu-box-shadow;
  }

  .layout-header {
    height: $aside-header-height;
    background-color: var(--el-header-bg-color);
  }

  .layout-main {
    box-sizing: border-box;
    padding: 0;
    overflow-x: hidden;
    background-color: var(--el-bg-color);
  }
}

.layout-scrollbar {
  width: 100%;
  height: calc(100vh - $aside-header-height);
}

.el-menu {
  border-right: none;
}
</style>
