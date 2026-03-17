<!-- 文件用途：用户订阅页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="用户" prop="user_id">
          <div class="user-picker">
            <el-button type="primary" plain @click="openUserDialog">选择用户</el-button>
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
        <el-form-item label="套餐" prop="plan_id">
          <el-select v-model="searchParams.plan_id" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in planOptions" :key="item.id" :label="item.plan_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in SUBSCRIPTION_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间" prop="expireAtRange">
          <el-date-picker
            v-model="expireAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleExpireAtChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
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
        <el-table-column v-if="getVisible('user_id')" column-key="user_id" label="用户" prop="user_id" align="center" :width="getWidth('user_id', 200)">
          <template #default="{ row }">
            <div class="creator-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.user?.avatar)" class="creator-avatar">
                {{ row.user?.nickname?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="creator-name">{{ row.user?.nickname || row.user_id || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('plan_name')" column-key="plan_name" label="套餐" prop="plan_name" align="center" :min-width="getWidth('plan_name', 160)" />
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('startAt')" column-key="startAt" label="开始时间" prop="startAt" align="center" :width="getWidth('startAt', 180)">
          <template #default="{ row }">{{ formatDate(row.startAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('expireAt')" column-key="expireAt" label="到期时间" prop="expireAt" align="center" :width="getWidth('expireAt', 180)">
          <template #default="{ row }">{{ formatDate(row.expireAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('updatedAt')" column-key="updatedAt" label="更新时间" prop="updatedAt" align="center" :width="getWidth('updatedAt', 180)">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" :width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToGrants(row)">发放记录</el-button>
            <el-button type="warning" link @click="goToManualGrant(row)">手动发放</el-button>
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
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Close } from "@element-plus/icons-vue";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { SUBSCRIPTION_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { getSubscriptionList } from "@/api/membership/subscriptions";
import type { SubscriptionListQuery, SubscriptionView } from "@/api/membership/subscriptions/type";
import { getPlanOptions } from "@/api/membership/plans";
import type { PlanOption } from "@/api/membership/plans/type";
import { koiMsgError, koiNoticeError } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";
import UserSelectDialog from "@/components/Common/UserSelectDialog.vue";
import type { AppUser } from "@/api/appUser/type";

const router = useRouter();
const loading = ref(false);
const tableData = ref<SubscriptionView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const planOptions = ref<PlanOption[]>([]);
const userDialogVisible = ref(false);
const selectedUser = ref<AppUser | null>(null);
const baseUrl = import.meta.env.VITE_SERVER;

// 查询参数
const searchParams = reactive<SubscriptionListQuery>({
  page: 1,
  limit: 10,
  user_id: "",
  status: "",
  plan_id: "",
  expireAtFrom: "",
  expireAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const expireAtRange = ref<[string, string] | []>([]);

const columns = [
  { key: "user_id", label: "用户", defaultWidth: 200 },
  { key: "plan_name", label: "套餐", defaultWidth: 160 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "startAt", label: "开始时间", defaultWidth: 180 },
  { key: "expireAt", label: "到期时间", defaultWidth: 180 },
  { key: "updatedAt", label: "更新时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-membership-subscriptions",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 获取状态显示文本
const getStatusLabel = (value: string) => {
  return SUBSCRIPTION_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: string) => {
  return SUBSCRIPTION_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

const resolveAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";
  return avatar.includes("http") ? avatar : `${baseUrl}${avatar}`;
};

// 获取列表
const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getSubscriptionList(searchParams);
    tableData.value = (res.data || []).map((item: SubscriptionView) => ({
      ...item,
      startAt: formatDate(item.startAt),
      expireAt: formatDate(item.expireAt),
      updatedAt: formatDate(item.updatedAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取订阅列表失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

// 获取套餐选项
const fetchPlanOptions = async () => {
  try {
    const res = await getPlanOptions();
    planOptions.value = res.data || [];
  } catch (error) {
    planOptions.value = [];
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
  searchParams.status = "";
  searchParams.plan_id = "";
  searchParams.expireAtFrom = "";
  searchParams.expireAtTo = "";
  selectedUser.value = null;
  expireAtRange.value = [];
  fetchList();
};

// 到期时间范围变化
const handleExpireAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.expireAtFrom = value[0];
    searchParams.expireAtTo = value[1];
  } else {
    searchParams.expireAtFrom = "";
    searchParams.expireAtTo = "";
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

// 跳转发放记录
const goToGrants = (row: SubscriptionView) => {
  router.push({ path: "/admin/membership/grants", query: { user_id: row.user_id } });
};

// 跳转手动发放
const goToManualGrant = (row: SubscriptionView) => {
  router.push({ path: "/admin/membership/grants/manual", query: { user_id: row.user_id } });
};

const openUserDialog = () => {
  userDialogVisible.value = true;
};

const handleSelectUser = (row: AppUser) => {
  selectedUser.value = row;
  searchParams.user_id = String(row.id);
  userDialogVisible.value = false;
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  searchParams.user_id = "";
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
  const header = ["用户ID", "套餐", "状态", "开始时间", "到期时间", "更新时间"];
  const rows = tableData.value.map(item => [
    item.user_id,
    item.plan_name || item.plan_id,
    getStatusLabel(item.status),
    item.startAt || "-",
    item.expireAt || "-",
    item.updatedAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "subscriptions.csv");
};

onMounted(() => {
  fetchPlanOptions();
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

.creator-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.creator-avatar {
  flex-shrink: 0;
}

.creator-name {
  color: var(--el-text-color-regular);
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}
</style>
