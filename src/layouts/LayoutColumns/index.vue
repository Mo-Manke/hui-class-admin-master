<template>
  <el-container class="layout-container">
    <div class="layout-column">
      <el-scrollbar>
        <div
          v-for="item in menuList"
          :key="item.path"
          class="left-column"
          :class="{ 'is-active': columnActive === item.path || `/${columnActive.split('/')[1]}` === item.path }"
          @click="handleSubMenu(item)"
        >
          <el-icon v-if="item.meta?.icon && String(item.meta.icon).indexOf(SVG_PREFIX) === -1">
            <component :is="item.meta.icon" />
          </el-icon>
          <el-icon v-if="item.meta?.icon && String(item.meta.icon).indexOf(SVG_PREFIX) === 0">
            <component is="SvgIcon" :name="item.meta.icon" />
          </el-icon>
          <span class="title">{{ item.meta?.title }}</span>
        </div>
      </el-scrollbar>
    </div>

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
        <Header />
      </el-header>
      <Main />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { SVG_PREFIX } from "@/config/index.ts";
import settings from "@/settings.ts";
import Logo from "@/layouts/components/Logo/index.vue";
import Header from "@/layouts/components/Header/index.vue";
import ColumnSubMenu from "@/layouts/components/Menu/ColumnSubMenu.vue";
import Main from "@/layouts/components/Main/index.vue";
import useAuthStore from "@/stores/modules/auth.ts";
import useGlobalStore from "@/stores/modules/global.ts";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

const menuAnimate = ref(settings.menuAnimate);
const menuHoverCollapse = ref(settings.columnMenuHoverCollapse);
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
</script>

<style lang="scss" scoped>
.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
  background-color: var(--el-menu-bg-color);
  box-shadow: $column-menu-box-shadow;

  .left-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 70px;
    min-height: 60px;
    margin: $aside-menu-padding-left;
    color: var(--el-menu-text-color);
    cursor: pointer;
    border: rgba(0, 0, 0, 0) solid 2px;

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

    .el-icon {
      font-size: 18px;
    }

    .title {
      margin-top: 8px;
      font-size: 12px;
      font-weight: $aside-menu-font-weight;
      line-height: 14px;
      text-align: center;
      letter-spacing: 2px;
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

<style lang="scss">
.el-menu--collapse {
  width: v-bind(menuHoverCollapse) !important;
}
</style>
