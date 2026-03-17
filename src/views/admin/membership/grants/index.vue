<!-- 文件用途：发放记录页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="用户ID" prop="user_id">
          <div class="user-picker">
            <el-button type="primary" plain @click="openUserDialog('filter')">选择用户</el-button>
            <div v-if="selectedUser || searchParams.user_id" class="user-picker__value">
              <span class="user-picker__text">
                {{ selectedUser ? `${selectedUser.nickname || selectedUser.username} (#${selectedUser.id})` : `ID: ${searchParams.user_id}` }}
              </span>
              <el-button type="danger" link @click="clearSelectedUser">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="动作类型" prop="action_type">
          <el-select v-model="searchParams.action_type" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in GRANT_ACTION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源类型" prop="source_type">
          <el-input v-model="searchParams.source_type" class="filter-input" clearable placeholder="来源类型" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="创建时间" prop="createdAtRange">
          <el-date-picker
            v-model="createdAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleCreatedAtChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <el-col :span="1.5">
          <el-button type="primary" icon="Edit" plain @click="goToManualGrant">手动发放</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" icon="Minus" plain @click="openDeductDialog">扣减时长</el-button>
        </el-col>
        <ListToolbar
          v-model:showSearch="showSearch"
          :show-export="true"
          :columns="columns"
          :column-state="columnState"
          @refresh="fetchList"
          @export="handleExport"
          @toggle-column="setVisible"
          @reset-columns="resetColumns"
        />
      </el-row>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <el-table
        v-else
        v-loading="loading"
        border
        :data="tableData"
        class="list-table"
        empty-text="暂无数据"
        @sort-change="handleSortChange"
        @header-dragend="handleHeaderDragend"
      >
        <el-table-column v-if="getVisible('user_id')" column-key="user_id" label="用户" prop="user_id" align="center" :width="getWidth('user_id', 180)">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.user?.avatar)" class="user-avatar">
                {{ row.user?.nickname?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="user-name">{{ row.user?.nickname || row.user_id || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('action_type')" column-key="action_type" label="动作类型" prop="action_type" align="center" :width="getWidth('action_type', 120)">
          <template #default="{ row }">{{ getGrantActionLabel(row.action_type) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('plan_id')" column-key="plan_id" label="套餐ID" prop="plan_id" align="center" :min-width="getWidth('plan_id', 160)" />
        <el-table-column v-if="getVisible('days_delta')" column-key="days_delta" label="天数变化" prop="days_delta" align="center" :width="getWidth('days_delta', 120)" />
        <el-table-column v-if="getVisible('startAt')" column-key="startAt" label="开始时间" prop="startAt" align="center" :width="getWidth('startAt', 180)">
          <template #default="{ row }">{{ formatDate(row.startAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('endAt')" column-key="endAt" label="结束时间" prop="endAt" align="center" :width="getWidth('endAt', 180)">
          <template #default="{ row }">{{ formatDate(row.endAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('source_type')" column-key="source_type" label="来源类型" prop="source_type" align="center" :width="getWidth('source_type', 120)">
          <template #default="{ row }">{{ getGrantSourceLabel(row.source_type) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('source_id')" column-key="source_id" label="来源ID" prop="source_id" align="center" :width="getWidth('source_id', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('remark')" column-key="remark" label="备注" prop="remark" align="center" :min-width="getWidth('remark', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.action_type === 'DEDUCT'" type="warning" link @click="openRevertDialog(row)">撤销扣减</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        background
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.totalRecords"
        class="list-pagination"
        @size-change="fetchList"
        @current-change="fetchList"
      />
      <UserSelectDialog v-model="userDialogVisible" @select="handleSelectUser" />
      <el-dialog v-model="deductDialogVisible" title="扣减会员时长" width="520px">
        <el-form ref="deductFormRef" :model="deductForm" :rules="deductRules" label-width="90px">
          <el-form-item label="用户" prop="user_id">
            <div class="user-picker">
              <el-button type="primary" plain @click="openUserDialog('deduct')">选择用户</el-button>
              <div v-if="deductUser || deductForm.user_id" class="user-picker__value">
                <span class="user-picker__text">
                  {{ deductUser ? `${deductUser.nickname || deductUser.username} (#${deductUser.id})` : `ID: ${deductForm.user_id}` }}
                </span>
                <el-button type="danger" link @click="clearDeductUser">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="套餐" prop="plan_id">
            <div class="plan-field">
              <span>{{ deductPlanName || "未获取" }}</span>
              <el-button type="default" plain @click="fetchDeductPlan">刷新订阅</el-button>
            </div>
          </el-form-item>
          <el-form-item label="扣减天数" prop="days_delta">
            <el-input-number v-model="deductForm.days_delta" :min="1" :step="1" controls-position="right" placeholder="请输入扣减天数" />
          </el-form-item>
          <el-form-item label="原因" prop="remark">
            <el-input v-model="deductForm.remark" type="textarea" :rows="3" placeholder="请输入扣减原因" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="deductDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="deductSubmitting" @click="submitDeduct">提交</el-button>
        </template>
      </el-dialog>
      <el-dialog v-model="revertDialogVisible" title="撤销扣减" width="520px">
        <el-form ref="revertFormRef" :model="revertForm" :rules="revertRules" label-width="90px">
          <el-form-item label="扣减记录" prop="grant_id">
            <el-input v-model="revertForm.grant_id" readonly />
          </el-form-item>
          <el-form-item label="原因" prop="remark">
            <el-input v-model="revertForm.remark" type="textarea" :rows="3" placeholder="请输入撤销原因" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="revertDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="revertSubmitting" @click="submitRevert">提交</el-button>
        </template>
      </el-dialog>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Close } from "@element-plus/icons-vue";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { GRANT_ACTION_OPTIONS, GRANT_SOURCE_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { createDeductGrant, createDeductRevert, getGrantList } from "@/api/membership/grants";
import type { DeductGrantRequest, DeductRevertRequest, GrantListQuery, GrantView } from "@/api/membership/grants/type";
import { getSubscriptionList } from "@/api/membership/subscriptions";
import { generateUUID } from "@/utils";
import { koiMsgError, koiMsgInfo, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";
import UserSelectDialog from "@/components/Common/UserSelectDialog.vue";
import type { AppUser } from "@/api/appUser/type";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const tableData = ref<GrantView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const userDialogVisible = ref(false);
const selectedUser = ref<AppUser | null>(null);
const deductUser = ref<AppUser | null>(null);
const baseUrl = import.meta.env.VITE_SERVER;
const userSelectMode = ref<"filter" | "deduct">("filter");
const deductDialogVisible = ref(false);
const deductSubmitting = ref(false);
const revertDialogVisible = ref(false);
const revertSubmitting = ref(false);
const deductFormRef = ref();
const revertFormRef = ref();
const deductPlanName = ref("");

// 查询参数
const searchParams = reactive<GrantListQuery>({
  page: 1,
  limit: 10,
  user_id: "",
  action_type: "",
  source_type: "",
  createdAtFrom: "",
  createdAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const createdAtRange = ref<[string, string] | []>([]);

const deductForm = reactive({
  user_id: 0,
  plan_id: null as number | null,
  days_delta: null as number | null,
  remark: "",
  idempotency_key: ""
});

const revertForm = reactive({
  grant_id: null as number | null,
  remark: "",
  idempotency_key: ""
});

const deductRules = reactive({
  user_id: [{ required: true, message: "请选择用户", trigger: "change" }],
  plan_id: [{ required: true, message: "请选择套餐", trigger: "change" }],
  days_delta: [
    { required: true, message: "请输入扣减天数", trigger: "blur" },
    {
      validator: (_rule: any, value: number, callback: (error?: Error) => void) => {
        if (!value || value <= 0) {
          callback(new Error("扣减天数必须为正整数"));
          return;
        }
        if (!Number.isInteger(value)) {
          callback(new Error("扣减天数必须为整数"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ],
  idempotency_key: [{ required: true, message: "幂等键不能为空", trigger: "blur" }]
});

const revertRules = reactive({
  grant_id: [{ required: true, message: "请选择扣减记录", trigger: "change" }],
  idempotency_key: [{ required: true, message: "幂等键不能为空", trigger: "blur" }]
});

const columns = [
  { key: "user_id", label: "用户", defaultWidth: 180 },
  { key: "action_type", label: "动作类型", defaultWidth: 120 },
  { key: "plan_id", label: "套餐ID", defaultWidth: 160 },
  { key: "days_delta", label: "天数变化", defaultWidth: 120 },
  { key: "startAt", label: "开始时间", defaultWidth: 180 },
  { key: "endAt", label: "结束时间", defaultWidth: 180 },
  { key: "source_type", label: "来源类型", defaultWidth: 120 },
  { key: "source_id", label: "来源ID", defaultWidth: 160 },
  { key: "remark", label: "备注", defaultWidth: 160 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-membership-grants",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 统一把后端英文状态码映射为中文，通过枚举表查找并回退到原值。
const getEnumLabel = (options: Array<{ value: string | number; label: string }>, value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  return options.find(item => item.value === value)?.label || String(value);
};

const getGrantActionLabel = (value: string | number | null | undefined) => getEnumLabel(GRANT_ACTION_OPTIONS, value);

const getGrantSourceLabel = (value: string | number | null | undefined) => getEnumLabel(GRANT_SOURCE_OPTIONS, value);

const resolveAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";
  return avatar.includes("http") ? avatar : `${baseUrl}${avatar}`;
};

const buildIdempotencyKey = (prefix: string, seed?: string | number | null) => {
  return `${prefix}-${seed || "auto"}-${generateUUID()}`;
};

const fetchDeductPlan = async () => {
  if (!deductForm.user_id) {
    koiMsgError("请先选择用户");
    return;
  }
  try {
    const res = await getSubscriptionList({
      page: 1,
      limit: 1,
      user_id: String(deductForm.user_id),
      status: "ACTIVE"
    });
    const subscription = (res.data || [])[0];
    if (!subscription) {
      deductForm.plan_id = null;
      deductPlanName.value = "";
      koiMsgError("未找到有效订阅，请先确认用户会员状态");
      return;
    }
    deductForm.plan_id = subscription.plan_id;
    deductPlanName.value = subscription.plan_name || subscription.plan_code || String(subscription.plan_id);
  } catch (error) {
    deductForm.plan_id = null;
    deductPlanName.value = "";
    koiNoticeError("获取订阅信息失败，请稍后重试");
  }
};

const resetDeductForm = () => {
  deductForm.user_id = 0;
  deductForm.plan_id = null;
  deductForm.days_delta = null;
  deductForm.remark = "";
  deductForm.idempotency_key = buildIdempotencyKey("deduct");
  deductUser.value = null;
  deductPlanName.value = "";
  deductFormRef.value?.clearValidate?.();
};

const resetRevertForm = () => {
  revertForm.grant_id = null;
  revertForm.remark = "";
  revertForm.idempotency_key = buildIdempotencyKey("revert");
  revertFormRef.value?.clearValidate?.();
};

const refreshDeductKey = () => {
  deductForm.idempotency_key = buildIdempotencyKey("deduct", deductForm.user_id);
};

const openDeductDialog = async () => {
  resetDeductForm();
  if (selectedUser.value) {
    deductForm.user_id = Number(selectedUser.value.id);
    deductUser.value = selectedUser.value;
  }
  await fetchDeductPlan();
  deductDialogVisible.value = true;
};

const openRevertDialog = (row: GrantView) => {
  resetRevertForm();
  revertForm.grant_id = row.id;
  revertForm.idempotency_key = buildIdempotencyKey("revert", row.id);
  revertDialogVisible.value = true;
};

// 获取列表
const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getGrantList(searchParams);
    tableData.value = (res.data || []).map((item: GrantView) => ({
      ...item,
      startAt: formatDate(item.startAt),
      endAt: formatDate(item.endAt),
      createdAt: formatDate(item.createdAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取发放记录失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  searchParams.page = 1;
  fetchList();
};

// 重置搜索
const resetSearch = () => {
  searchParams.page = 1;
  searchParams.limit = 10;
  searchParams.user_id = "";
  searchParams.action_type = "";
  searchParams.source_type = "";
  searchParams.createdAtFrom = "";
  searchParams.createdAtTo = "";
  selectedUser.value = null;
  createdAtRange.value = [];
  fetchList();
};

// 创建时间范围变化
const handleCreatedAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.createdAtFrom = value[0];
    searchParams.createdAtTo = value[1];
  } else {
    searchParams.createdAtFrom = "";
    searchParams.createdAtTo = "";
  }
};

// 排序
const handleSortChange = (payload: { prop: string; order: "ascending" | "descending" | null }) => {
  if (!payload.order) {
    delete (searchParams as Record<string, string>).sort_by;
    delete (searchParams as Record<string, string>).sort_order;
  } else {
    (searchParams as Record<string, string>).sort_by = payload.prop;
    (searchParams as Record<string, string>).sort_order = payload.order === "ascending" ? "ASC" : "DESC";
  }
  fetchList();
};

const submitDeduct = () => {
  if (!deductFormRef.value) return;
  deductFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      deductSubmitting.value = true;
      if (!deductForm.plan_id) {
        await fetchDeductPlan();
        if (!deductForm.plan_id) {
          deductSubmitting.value = false;
          return;
        }
      }
      // 后端要求扣减为负数，保持表单输入为正数以便操作。
      const payload: DeductGrantRequest = {
        user_id: Number(deductForm.user_id),
        plan_id: Number(deductForm.plan_id),
        days_delta: -Math.abs(Number(deductForm.days_delta)),
        remark: deductForm.remark || undefined,
        idempotency_key: deductForm.idempotency_key
      };
      const res = await createDeductGrant(payload);
      deductForm.idempotency_key = res?.data?.idempotency_key || deductForm.idempotency_key;
      koiNoticeSuccess("扣减成功");
      deductDialogVisible.value = false;
      fetchList();
    } catch (error) {
      const state = resolveRequestError(error, "扣减失败，请稍后重试");
      koiNoticeError(state.message);
    } finally {
      deductSubmitting.value = false;
    }
  });
};

const submitRevert = () => {
  if (!revertFormRef.value) return;
  revertFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      revertSubmitting.value = true;
      const payload: DeductRevertRequest = {
        grant_id: Number(revertForm.grant_id),
        remark: revertForm.remark || undefined,
        idempotency_key: revertForm.idempotency_key
      };
      const res = await createDeductRevert(payload);
      revertForm.idempotency_key = res?.data?.idempotency_key || revertForm.idempotency_key;
      koiNoticeSuccess("撤销扣减成功");
      revertDialogVisible.value = false;
      fetchList();
    } catch (error) {
      const state = resolveRequestError(error, "撤销扣减失败，请稍后重试");
      if (state.message.includes("已撤销")) {
        koiMsgInfo("已撤销");
        revertDialogVisible.value = false;
        fetchList();
        return;
      }
      koiNoticeError(state.message);
    } finally {
      revertSubmitting.value = false;
    }
  });
};

// 跳转手动发放
const goToManualGrant = () => {
  router.push({ path: "/admin/membership/grants/manual", query: { user_id: searchParams.user_id || undefined } });
};

const openUserDialog = (mode: "filter" | "deduct") => {
  userSelectMode.value = mode;
  userDialogVisible.value = true;
};

const handleSelectUser = (row: AppUser) => {
  if (userSelectMode.value === "deduct") {
    deductUser.value = row;
    deductForm.user_id = Number(row.id);
    refreshDeductKey();
    fetchDeductPlan();
  } else {
    selectedUser.value = row;
    searchParams.user_id = String(row.id);
  }
  userDialogVisible.value = false;
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  searchParams.user_id = "";
};

const clearDeductUser = () => {
  deductUser.value = null;
  deductForm.user_id = 0;
};

// 格式化时间
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

// 导出
const handleExport = () => {
  if (!tableData.value.length) {
    koiMsgError("暂无数据可导出");
    return;
  }
  const header = ["用户ID", "动作类型", "套餐ID", "天数变化", "开始时间", "结束时间", "来源类型", "来源ID", "备注", "创建时间"];
  const rows = tableData.value.map(item => [
    item.user_id,
    getGrantActionLabel(item.action_type),
    item.plan_id,
    item.days_delta,
    item.startAt || "-",
    item.endAt || "-",
    getGrantSourceLabel(item.source_type),
    item.source_id || "",
    item.remark || "",
    item.createdAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "grants.csv");
};

onMounted(() => {
  if (route.query.user_id) {
    searchParams.user_id = String(route.query.user_id || "");
  }
  fetchList();
});
</script>

<style lang="scss" scoped>
.filter-form {
  margin-bottom: 12px;
}

.filter-input {
  width: 200px;
}

.filter-select {
  width: 160px;
}

.filter-date {
  width: 240px;
}

.list-toolbar-row {
  margin-bottom: 12px;
}

.list-table {
  width: 100%;
}

.list-pagination {
  margin-top: 16px;
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

.plan-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
