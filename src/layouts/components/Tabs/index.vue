<template>
  <el-tabs
    v-model="activeTab"
    type="card"
    class="koi-tabs"
    @tab-remove="removeTab"
    @tab-click="clickToggleTab"
    @contextmenu.prevent="handleTabsMenuParent($event)"
  >
    <el-tab-pane v-for="item in tabList" :key="item.path" :label="item.title" :name="item.path" :closable="item.closeIcon">
      <template #label>
        <div class="flex flex-justify-center flex-items-center select-none" @contextmenu.prevent="handleTabsMenuChildren(item.path, $event)">
          <KoiGlobalIcon class="m-r-2px" v-show="item.icon" :name="item.icon" size="16"></KoiGlobalIcon>
          <div class="p-t-1px">
            <div>{{ item.title }}</div>
          </div>
        </div>
      </template>
    </el-tab-pane>
  </el-tabs>

  <div>
    <TabMenu ref="tabMenuRef"></TabMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { TabsPaneContext } from "element-plus";
// @ts-ignore
import Sortable from "sortablejs";
import TabMenu from "@/layouts/components/Tabs/components/TabMenu.vue";
import { HOME_URL } from "@/config/index.ts";
import { koiMsgWarning } from "@/utils/koi.ts";
import useTabsStore from "@/stores/modules/tabs.ts";
import useAuthStore from "@/stores/modules/auth.ts";

const route = useRoute();
const router = useRouter();
const tabsStore = useTabsStore();
const authStore = useAuthStore();

onMounted(() => {
  tabsStore.syncWithRoutes(authStore.showMenuList as any[]);
  addTab();
  setActiveTab();
  initTabs();
  tabsDrop();
});

watch(
  () => route.fullPath,
  () => {
    if (route.meta.isFull == "0") return;
    setActiveTab();
    addTab();
  }
);

const initTabs = () => {
  tabsStore.syncWithRoutes(authStore.showMenuList as any[]);
  authStore.menuList.forEach((item: any) => {
    if (item.meta?.isAffix == "0" && item.meta?.isHide == "1" && item.meta?.isFull == "1") {
      const tabsParams = {
        icon: item.meta.icon,
        title: item.meta.title,
        path: item.path,
        name: item.name,
        closeIcon: false,
        isKeepAlive: item.meta.isKeepAlive
      };
      tabsStore.addTab(tabsParams, authStore.showMenuList as any[]);
    }
  });
};

const tabList = computed(() => tabsStore.getTabs);

const activeTab = ref(route.fullPath);
const setActiveTab = () => {
  activeTab.value = route.fullPath;
};

const addTab = () => {
  const { meta, fullPath } = route;
  const tab = {
    icon: meta.icon,
    title: meta.title as string,
    path: fullPath,
    name: route.name as string,
    closeIcon: route.meta.isAffix == "1",
    isKeepAlive: route.meta.isKeepAlive
  };
  if (fullPath == HOME_URL) tab.closeIcon = false;
  tabsStore.addTab(tab, authStore.showMenuList as any[]);
};

const removeTab = (fullPath: any) => {
  const objectNumber = tabsStore.tabList.filter((item: any) => typeof item === "object").length;
  if (objectNumber == 1) {
    koiMsgWarning("已经是最后一个页签了");
    return;
  }
  tabsStore.removeTab(fullPath as string, fullPath == route.fullPath, "NULL");
};

const clickToggleTab = (tab: TabsPaneContext) => {
  const { props } = tab;
  router.push({ path: props.name as string });
};

const tabsDrop = () => {
  nextTick(() => {
    const navEl = document.querySelector(".el-tabs__nav") as HTMLElement | null;
    if (!navEl) return;
    Sortable.create(navEl, {
      draggable: ".el-tabs__item",
      animation: 300,
      // @ts-ignore
      onEnd({ newIndex, oldIndex }) {
        const tabsList = [...tabsStore.tabList];
        const currentRow = tabsList.splice(oldIndex as number, 1)[0];
        tabsList.splice(newIndex as number, 0, currentRow);
        tabsStore.setTab(tabsList);
      }
    });
  });
};

const tabMenuRef = ref();
const handleTabsMenuParent = (value: any) => {
  if (tabMenuRef.value) {
    tabMenuRef.value.handleKoiMenuParent(value);
  } else {
    koiMsgWarning("右键菜单初始化失败，请刷新页面重试");
  }
};

const handleTabsMenuChildren = (path: any, value: any) => {
  if (tabMenuRef.value) {
    tabMenuRef.value.handleKoiMenuChildren(path, value);
  } else {
    koiMsgWarning("右键菜单初始化失败，请刷新页面重试");
  }
};
</script>

<style lang="scss" scoped>
.koi-tabs {
  border-bottom: 1px solid #e0e0e6;
  @apply dark:border-#313233;
  background-color: var(--el-bg-color);
}

:deep(.el-tabs__item) {
  margin-top: 2px !important;
}

:deep(.el-tabs__item:first-child) {
  margin-left: 8px;
}

:deep(.el-tabs__item:nth-child(n)) {
  border: 1px solid #e0e0e6 !important;
}

:deep(.el-tabs__item:not(:active)) {
  border: 1px solid #e0e0e6;
}

:deep(.el-tabs__item) {
  height: 28px;
  margin-left: 6px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #e0e0e6;
  border-radius: 4px;

  .is-top {
    border-bottom: none !important;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    border: none;
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
    border: 1px solid var(--el-color-primary) !important;
  }
}

:deep(.el-tabs__header) {
  border-top: 1px solid var(--el-color-info-light-7);
  border-bottom: 1px solid var(--el-color-info-light-7);
  margin: 0;
}

:deep(.el-tabs__nav.is-top) {
  height: 32px;
  border: none;
  border-radius: 4px;
}

:deep(.el-tabs__nav) {
  border: none !important;
}

:deep(.el-tabs__nav-prev) {
  line-height: 35px;
}

:deep(.el-tabs__nav-next) {
  line-height: 35px;
}
</style>
