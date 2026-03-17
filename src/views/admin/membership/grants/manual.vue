<!-- 文件用途：手动发放页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <div class="manual-toolbar">
        <el-button icon="ArrowLeft" plain @click="handleBack">返回记录</el-button>
      </div>
      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />
      <el-form v-else ref="formRef" v-loading="pageLoading" :model="form" :rules="rules" label-width="110px" status-icon>
        <el-form-item label="用户ID" prop="user_id">
          <div class="user-picker">
            <el-button type="primary" plain @click="openUserDialog">选择用户</el-button>
            <div v-if="selectedUser || form.user_id" class="user-picker__value">
              <span class="user-picker__text">
                {{ selectedUser ? `${selectedUser.nickname || selectedUser.username} (#${selectedUser.id})` : `ID: ${form.user_id}` }}
              </span>
              <el-button type="danger" link @click="clearSelectedUser">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="套餐" prop="plan_id">
          <el-select v-model="form.plan_id" placeholder="请选择套餐">
            <el-option v-for="item in planOptions" :key="item.id" :label="item.plan_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="天数变化" prop="days_delta">
          <el-input-number v-model="form.days_delta" :min="daysDeltaMin" :max="daysDeltaMax" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startAt">
          <el-date-picker
            v-model="form.startAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="默认当前时间"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      <UserSelectDialog v-model="userDialogVisible" @select="handleSelectUser" />
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Close } from "@element-plus/icons-vue";
import { getPlanOptions } from "@/api/membership/plans";
import type { PlanOption } from "@/api/membership/plans/type";
import { createManualGrant } from "@/api/membership/grants";
import type { ManualGrantRequest } from "@/api/membership/grants/type";
import { koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { generateUUID } from "@/utils/index";
import { resolveRequestError } from "@/utils/requestState";
import UserSelectDialog from "@/components/Common/UserSelectDialog.vue";
import type { AppUser } from "@/api/appUser/type";

const router = useRouter();
const route = useRoute();
const formRef = ref();
const pageLoading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);
const submitting = ref(false);
const planOptions = ref<PlanOption[]>([]);
const userDialogVisible = ref(false);
const selectedUser = ref<AppUser | null>(null);

// 天数范围限制
const daysDeltaMin = -3650;
const daysDeltaMax = 3650;

// 表单数据
const form = reactive({
  user_id: null as number | null,
  plan_id: null as number | null,
  days_delta: 1,
  startAt: "",
  remark: ""
});

// 校验规则
const rules = reactive({
  user_id: [{ required: true, message: "请选择用户", trigger: "change" }],
  plan_id: [{ required: true, message: "请选择套餐", trigger: "change" }],
  days_delta: [
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        if (!Number.isInteger(value) || value === 0) {
          callback(new Error("天数变化必须为非 0 整数"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ],
  remark: [{ required: true, message: "请输入备注", trigger: "blur" }]
});

// 获取套餐选项
const fetchPlanOptions = async () => {
  try {
    pageLoading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getPlanOptions();
    planOptions.value = res.data || [];
  } catch (error) {
    const state = resolveRequestError(error, "获取套餐列表失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
    planOptions.value = [];
  } finally {
    pageLoading.value = false;
  }
};

// 提交表单
const handleSubmit = () => {
  if (!formRef.value) return;
  submitting.value = true;
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      koiMsgError("验证失败，请检查填写内容");
      submitting.value = false;
      return;
    }
    try {
      const payload: ManualGrantRequest = {
        user_id: Number(form.user_id),
        plan_id: Number(form.plan_id),
        days_delta: form.days_delta,
        startAt: form.startAt || null,
        remark: form.remark,
        idempotency_key: generateUUID()
      };
      await createManualGrant(payload);
      koiNoticeSuccess("提交成功");
      resetForm();
      handleBack();
    } catch (error) {
      koiNoticeError("提交失败，请稍后重试");
    } finally {
      submitting.value = false;
    }
  });
};

// 重置表单
const resetForm = () => {
  form.user_id = null;
  form.plan_id = null;
  form.days_delta = 1;
  form.startAt = "";
  form.remark = "";
  selectedUser.value = null;
  formRef.value?.clearValidate();
};

// 返回列表
const handleBack = () => {
  router.push({ path: "/admin/membership/grants" });
};

const openUserDialog = () => {
  userDialogVisible.value = true;
};

const handleSelectUser = (row: AppUser) => {
  selectedUser.value = row;
  form.user_id = Number(row.id);
  userDialogVisible.value = false;
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  form.user_id = null;
};

onMounted(() => {
  if (route.query.user_id) {
    form.user_id = Number(route.query.user_id || 0) || null;
    const userName = String(route.query.user_name || "");
    if (userName) {
      selectedUser.value = {
        id: Number(route.query.user_id),
        nickname: userName
      } as AppUser;
    }
  }
  fetchPlanOptions();
});
</script>

<style lang="scss" scoped>
.manual-toolbar {
  margin-bottom: 12px;
}

.user-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-picker__value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-picker__text {
  color: var(--el-text-color-regular);
}
</style>
