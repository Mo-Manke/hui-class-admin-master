<template>
  <el-image class="w-34px h-34px rounded-full select-none user-avatar" :src="avatar">
    <template #error>
      <el-image class="w-34px h-34px rounded-full select-none user-avatar" :src="errorAvatar" />
    </template>
  </el-image>
  <el-dropdown class="m-l-10px" :hide-on-click="false" @command="handleCommand">
    <div class="koi-dropdown">
      <div class="max-w-113px text-14px m-r-6px line-clamp-1 select-none">{{ nickname }}</div>
      <el-icon><arrow-down /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="profile">个人中心</el-dropdown-item>
        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { LOGIN_URL } from "@/config";
import { koiLocalStorage, koiSessionStorage } from "@/utils/storage.ts";
import useAuthStore from "@/stores/modules/auth.ts";

const router = useRouter();
const authStore = useAuthStore();

const avatar = ref("");
const nickname = ref("");
const errorAvatar = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";

onMounted(async () => {
  const userInfo = await authStore.getLoginUserInfo();
  avatar.value = import.meta.env.VITE_SERVER + (userInfo?.avatar || "");
  nickname.value = userInfo?.nickname || userInfo?.username || "";
});

const handleLogout = () => {
  koiSessionStorage.clear();
  koiLocalStorage.remove("user");
  koiLocalStorage.remove("keepAlive");
  koiLocalStorage.remove("tabs");
  window.location.replace(LOGIN_URL);
};

const handleCommand = (command: string | number) => {
  switch (command) {
    case "profile":
      router.push("/personage");
      break;
    case "logout":
      handleLogout();
      break;
  }
};
</script>

<style lang="scss" scoped>
.koi-dropdown {
  color: var(--el-color-primary);
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
}
</style>
