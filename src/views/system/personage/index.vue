<template>
  <div class="personage-page">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <div class="profile-card">
            <div class="avatar-box">
              <KoiUploadImage v-model:imageUrl="mineForm.avatar" action="/api/admin/upload">
                <template #content>
                  <el-icon><Avatar /></el-icon>
                  <span>上传头像</span>
                </template>
              </KoiUploadImage>
            </div>

            <div class="profile-row">
              <span class="profile-label">
                <el-icon><UserFilled /></el-icon>
                登录名称
              </span>
              <span>{{ mine.username || "-" }}</span>
            </div>
            <div class="profile-row">
              <span class="profile-label">
                <el-icon><User /></el-icon>
                用户名称
              </span>
              <span>{{ mine.nickname || "-" }}</span>
            </div>
            <div class="profile-row">
              <span class="profile-label">
                <el-icon><Calendar /></el-icon>
                创建日期
              </span>
              <span>{{ formatTime(mine.createdAt) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <el-tabs v-model="activeName">
            <el-tab-pane label="基本资料" name="profile">
              <el-form ref="mineFormRef" :model="mineForm" :rules="mineRules" label-width="96px" status-icon>
                <el-form-item label="头像">
                  <KoiUploadImage v-model:imageUrl="mineForm.avatar" action="/api/admin/upload" />
                </el-form-item>
                <el-form-item label="用户名称" prop="nickname">
                  <el-input v-model="mineForm.nickname" placeholder="请输入用户名称" clearable />
                </el-form-item>
                <el-form-item label="登录 IP">
                  <el-input v-model="mineForm.login_ip" placeholder="自动回填当前登录 IP" clearable />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleMineSave">保存</el-button>
                  <el-button @click="resetMineForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="96px" status-icon>
                <el-form-item label="旧密码" prop="old_password">
                  <el-input v-model="pwdForm.old_password" type="password" show-password clearable placeholder="请输入旧密码" />
                </el-form-item>
                <el-form-item label="新密码" prop="new_password">
                  <el-input v-model="pwdForm.new_password" type="password" show-password clearable placeholder="请输入新密码" />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="pwdForm.confirmPassword"
                    type="password"
                    show-password
                    clearable
                    placeholder="请再次输入新密码"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handlePwdSave">保存</el-button>
                  <el-button @click="resetPwdForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="personagePage">
import { nextTick, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import useAuthStore from "@/stores/modules/auth.ts";
import useUserStore from "@/stores/modules/user.ts";
import { updateUserInfo, updateUserPassword } from "@/api/system/user/index.ts";

const authStore = useAuthStore();
const userStore = useUserStore();

const activeName = ref("profile");
const mineFormRef = ref<FormInstance>();
const pwdFormRef = ref<FormInstance>();

const mine = ref({
  avatar: "",
  username: "",
  nickname: "",
  login_ip: "",
  createdAt: ""
});

const mineForm = ref({
  avatar: "",
  nickname: "",
  login_ip: ""
});

const pwdForm = ref({
  old_password: "",
  new_password: "",
  confirmPassword: ""
});

const mineRules = reactive<FormRules>({
  nickname: [{ required: true, message: "请输入用户名称", trigger: "blur" }]
});

const pwdRules = reactive<FormRules>({
  old_password: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  new_password: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }]
});

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const syncMineForm = (userInfo: any) => {
  mine.value = {
    avatar: userInfo?.avatar || "",
    username: userInfo?.username || "",
    nickname: userInfo?.nickname || "",
    login_ip: userInfo?.login_ip || "",
    createdAt: userInfo?.createdAt || ""
  };
  mineForm.value = {
    avatar: mine.value.avatar,
    nickname: mine.value.nickname,
    login_ip: mine.value.login_ip
  };
};

const loadMine = async () => {
  const userInfo = await authStore.getLoginUserInfo();
  syncMineForm(userInfo);
};

const resetMineForm = () => {
  nextTick(() => mineFormRef.value?.clearValidate());
  mineForm.value = {
    avatar: mine.value.avatar,
    nickname: mine.value.nickname,
    login_ip: mine.value.login_ip
  };
};

const resetPwdForm = () => {
  nextTick(() => pwdFormRef.value?.clearValidate());
  pwdForm.value = {
    old_password: "",
    new_password: "",
    confirmPassword: ""
  };
};

const handleMineSave = async () => {
  if (!mineFormRef.value) return;
  await mineFormRef.value.validate();
  await updateUserInfo({
    avatar: mineForm.value.avatar,
    nickname: mineForm.value.nickname,
    login_ip: mineForm.value.login_ip
  });

  const currentInfo = await authStore.getLoginUserInfo();
  const nextUserInfo = {
    ...currentInfo,
    username: currentInfo?.username || mine.value.username || "",
    avatar: mineForm.value.avatar,
    nickname: mineForm.value.nickname,
    login_ip: mineForm.value.login_ip
  };
  authStore.setLoginUserInfo(nextUserInfo);
  userStore.setUserInfo(nextUserInfo);
  syncMineForm(nextUserInfo);
  ElMessage.success("保存成功");
};

const handlePwdSave = async () => {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate();
  if (pwdForm.value.new_password !== pwdForm.value.confirmPassword) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }
  await updateUserPassword({
    old_password: pwdForm.value.old_password,
    new_password: pwdForm.value.new_password
  });
  resetPwdForm();
  ElMessage.success("密码修改成功");
};

onMounted(loadMine);
</script>

<style lang="scss" scoped>
.personage-page {
  padding: 4px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-box {
  display: flex;
  justify-content: center;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.profile-row:last-child {
  border-bottom: none;
}

.profile-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
