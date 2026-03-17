<template>
  <Maximize v-show="globalStore.maximize" />
  <Tabs v-if="showTabs"></Tabs>
  <el-main class="layout-main">
    <router-view v-slot="{ Component, route }">
      <transition :name="transition" mode="out-in" appear>
        <keep-alive :max="16" :include="keepAliveStore.keepAliveName">
          <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
        </keep-alive>
      </transition>
    </router-view>
  </el-main>
</template>

<script setup lang="ts">
import { ref, watch, provide, onBeforeUnmount } from "vue";
import Maximize from "@/layouts/components/Main/components/Maximize.vue";
import { useDebounceFn } from "@vueuse/core";
import Tabs from "@/layouts/components/Tabs/index.vue";
import { storeToRefs } from "pinia";
import useKeepAliveStore from "@/stores/modules/keepAlive.ts";
import useGlobalStore from "@/stores/modules/global.ts";

const globalStore = useGlobalStore();
const { transition } = storeToRefs(globalStore);
const keepAliveStore = useKeepAliveStore();

const isRouterShow = ref(true);
const refreshCurrentPage = (val: boolean) => (isRouterShow.value = val);
provide("refresh", refreshCurrentPage);

watch(
  () => globalStore.maximize,
  () => {
    const app = document.getElementById("app") as HTMLElement;
    if (globalStore.maximize) app.classList.add("main-maximize");
    else app.classList.remove("main-maximize");
    const event = new Event("resize");
    window.dispatchEvent(event);
  },
  { deep: true, immediate: true }
);

const screenWidth = ref(0);
const showTabs = ref(true);
const listeningWindow = useDebounceFn(() => {
  screenWidth.value = document.body.clientWidth;
  if (!globalStore.isCollapse && screenWidth.value < 1200) globalStore.setGlobalState("isCollapse", true);
  if (globalStore.isCollapse && screenWidth.value > 1200) globalStore.setGlobalState("isCollapse", false);
  if (screenWidth.value < 520) {
    showTabs.value = false;
  } else {
    showTabs.value = true;
  }
}, 100);

window.addEventListener("resize", listeningWindow, false);

onBeforeUnmount(() => {
  window.removeEventListener("resize", listeningWindow);
});
</script>

<style lang="scss" scoped>
@import "../../../styles/transition.scss";

.layout-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 5px 6px;
  overflow-x: hidden;
  @apply bg-[#F6F9FE] dark:bg-black;
}
</style>
