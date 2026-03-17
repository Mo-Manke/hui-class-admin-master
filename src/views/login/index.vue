<template>
  <div class="h-full">
    <el-row class="h-100%">
      <div class="absolute top-10px right-10px">
        <KoiDark />
      </div>
      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="flex items-center justify-center">
        <div class="login-background w-85% h-100%"></div>
        <div class="absolute left-auto select-none">
          <el-image class="w-400px h-360px mb-50px animate-float <md:hidden <lg:w-360px h-320px" :src="bg" />
          <div class="font-bold text-3xl chroma-text mb-6px text-center <lg:text-2xl <md:hidden">
            欢迎登录 {{ settings.loginTitle || "课表后台管理平台" }}
          </div>
          <div class="chroma-text text-lg text-center <md:hidden">课程、轮播图与系统配置统一管理</div>
        </div>
      </el-col>
      <el-col :lg="8" :md="12" :sm="9" :xs="24" class="dark:bg-#161616 bg-gray-100 flex items-center justify-center flex-col">
        <div class="flex items-center">
          <el-image class="rounded-full w-36px h-36px" :src="logo" />
          <div class="ml-6px font-bold text-xl">{{ settings.loginTitle || "课表后台管理平台" }}</div>
        </div>
        <div class="flex items-center space-x-3 text-gray-400 mt-16px mb-16px">
          <span class="h-1px w-16 bg-gray-300 inline-block"></span>
          <span class="text-center">账号密码登录</span>
          <span class="h-1px w-16 bg-gray-300 inline-block"></span>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="w-260px">
          <el-form-item prop="loginName">
            <el-input v-model="loginForm.loginName" type="text" placeholder="请输入用户名" :suffix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password :suffix-icon="Lock" />
          </el-form-item>
          <el-form-item prop="securityCode">
            <el-input
              v-model="loginForm.securityCode"
              type="text"
              placeholder="请输入验证码"
              :suffix-icon="Open"
              @keydown.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-image class="w-100px h-30px" :src="loginForm.captchaPicture" @click="handleCaptcha" />
            <el-button text size="small" class="ml-6px" @click="handleCaptcha">
              <div class="text-gray-400 hover:text-#2992FF select-none">看不清，换一张</div>
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button
              v-if="!loading"
              type="primary"
              class="w-245px bg-[--el-color-primary]"
              round
              v-throttle:3000="handleLogin"
            >
              登录
            </el-button>
            <el-button v-else type="primary" class="w-245px bg-[--el-color-primary]" round :loading="loading">
              登录中
            </el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { Lock, Open, User } from "@element-plus/icons-vue";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useRouter } from "vue-router";
import { koiMsgError, koiMsgWarning } from "@/utils/koi.ts";
import { getAssets } from "@/utils/index.ts";
import settings from "@/settings";
import KoiDark from "./components/KoiDark.vue";
import { getGraphicsCaptcha } from "@/api/system/comon";
import { adminLogin } from "@/api/system/user";
import useUserStore from "@/stores/modules/user.ts";
import useAuthStore from "@/stores/modules/auth.ts";
import useKeepAliveStore from "@/stores/modules/keepAlive.ts";
import useTabsStore from "@/stores/modules/tabs.ts";
import { HOME_URL, LOGIN_URL } from "@/config/index.ts";

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();

const logo = getAssets("images/logo/logo.jpg");
const bg = getAssets("images/login/bg.png");
const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const captchaTimer = ref<number | undefined>();

interface LoginFormState {
  loginName: string;
  password: string;
  securityCode: string;
  captchaPicture: string;
}

const loginForm = reactive<LoginFormState>({
  loginName: "admin",
  password: "admin",
  securityCode: "",
  captchaPicture: ""
});

const loginRules = reactive<FormRules<LoginFormState>>({
  loginName: [{ required: true, message: "用户名不能为空", trigger: "blur" }],
  password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
  securityCode: [{ required: true, message: "验证码不能为空", trigger: "blur" }]
});

const handleCaptcha = async () => {
  try {
    const res: any = await getGraphicsCaptcha({ type: "ADMIN_LOGIN" });
    loginForm.captchaPicture = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(res.data)}`;
  } catch {
    koiMsgError("验证码获取失败");
  }
};

const startCaptchaTimer = () => {
  captchaTimer.value = window.setInterval(() => {
    handleCaptcha();
  }, 345000);
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate();

  loading.value = true;
  try {
    const res: any = await adminLogin({
      username: loginForm.loginName,
      password: loginForm.password,
      captcha: loginForm.securityCode
    });

    const token = res?.data?.token;
    if (!token) {
      koiMsgError("登录返回数据异常");
      await handleCaptcha();
      loginForm.securityCode = "";
      return;
    }

    userStore.setToken(token);

    if (!userStore.token) {
      koiMsgWarning("请重新登录");
      router.replace(LOGIN_URL);
      return;
    }

    await authStore.listRouters();
    await authStore.getLoginUserInfo();

    tabsStore.setTab([]);
    keepAliveStore.setKeepAliveName([]);
    loginForm.securityCode = "";

    router.replace(HOME_URL);
  } catch {
    await handleCaptcha();
    loginForm.securityCode = "";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  handleCaptcha();
  startCaptchaTimer();
});

onUnmounted(() => {
  if (captchaTimer.value) window.clearInterval(captchaTimer.value);
});
</script>

<style lang="scss" scoped>
.login-background {
  background: linear-gradient(155deg, #07070915 12%, var(--el-color-primary) 36%, #07070915 76%);
  filter: blur(100px);
}

.animate-float {
  animation: float 5s linear 0ms infinite;
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
