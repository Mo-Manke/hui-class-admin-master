<template>
  <el-tooltip placement="left" content="语言翻译">
    <div class="hover:bg-[rgba(0,0,0,0.06)] koi-icon w-32px h-100% flex flex-justify-center flex-items-center">
      <el-dropdown @command="changeLanguage">
        <el-icon class="koi-icon" :size="20"><SwitchFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in languageList"
              :key="item.value"
              :command="item.value"
              :disabled="language === item.value"
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
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import useGlobalStore from "@/stores/modules/global.ts";
import { LanguageType } from "@/stores/interface/index.ts";

const i18n = useI18n();
const globalStore = useGlobalStore();
const language = computed(() => globalStore.language);

const languageList = [
  { label: "简体中文", value: "zh" },
  { label: "English", value: "en" }
];

const changeLanguage = (lang: string) => {
  i18n.locale.value = lang;
  globalStore.setGlobalState("language", lang as LanguageType);
};
</script>

<style lang="scss" scoped></style>
