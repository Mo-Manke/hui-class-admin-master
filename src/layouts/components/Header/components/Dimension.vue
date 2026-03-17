<template>
  <el-tooltip placement="left" content="尺寸配置">
    <div class="hover:bg-[rgba(0,0,0,0.06)] koi-icon w-32px h-100% flex flex-justify-center flex-items-center">
      <el-dropdown @command="handleDimension">
        <el-icon class="koi-icon p-b-2px" :size="22"><ElementPlus /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in dimensionList"
              :key="item.value"
              :command="item.value"
              :disabled="dimension === item.value"
            >
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import useGlobalStore from "@/stores/modules/global.ts";
import { koiMsgSuccess } from "@/utils/koi.ts";

const globalStore = useGlobalStore();
const dimension = computed(() => globalStore.dimension);

const dimensionList = [
  { label: "默认", value: "default" },
  { label: "大型", value: "large" },
  { label: "小型", value: "small" }
];

const handleDimension = (item: string) => {
  if (dimension.value === item) return;
  globalStore.setDimension(item);
  koiMsgSuccess("配置成功🌻");
};
</script>

<style lang="scss" scoped></style>
