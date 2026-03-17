<!-- 文件用途：兑换记录页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="用户ID" prop="user_id">
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
        <el-form-item label="兑换码" prop="code">
          <el-input v-model="searchParams.code" class="filter-input" clearable placeholder="兑换码" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="批次号" prop="batch_no">
          <el-input v-model="searchParams.batch_no" class="filter-input" clearable placeholder="批次号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in REDEEM_RECORD_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换时间" prop="redeemedAtRange">
          <el-date-picker
            v-model="redeemedAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleRedeemedAtChange"
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
        <el-table-column v-if="getVisible('user_id')" column-key="user_id" label="用户" prop="user_id" align="center" :width="getWidth('user_id', 180)">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.app_user?.avatar)" class="user-avatar">
                {{ row.app_user?.nickname?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="user-name">{{ row.app_user?.nickname || row.user_id || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('code')" column-key="code" label="兑换码" prop="code" align="center" :min-width="getWidth('code', 180)" />
        <el-table-column v-if="getVisible('batch_no')" column-key="batch_no" label="批次号" prop="batch_no" align="center" :min-width="getWidth('batch_no', 180)" />
        <el-table-column v-if="getVisible('plan_id')" column-key="plan_id" label="套餐ID" prop="plan_id" align="center" :min-width="getWidth('plan_id', 160)" />
        <el-table-column v-if="getVisible('duration_days')" column-key="duration_days" label="时长(天)" prop="duration_days" align="center" :width="getWidth('duration_days', 120)" />
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('fail_reason')" column-key="fail_reason" label="失败原因" prop="fail_reason" align="center" :min-width="getWidth('fail_reason', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('redeemedAt')" column-key="redeemedAt" label="兑换时间" prop="redeemedAt" align="center" :width="getWidth('redeemedAt', 180)">
          <template #default="{ row }">{{ formatDate(row.redeemedAt) }}</template>
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
import { Close } from "@element-plus/icons-vue";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { REDEEM_RECORD_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { getRedeemRecordList } from "@/api/redeem/records";
import type { RedeemRecordListQuery, RedeemRecordView } from "@/api/redeem/records/type";
import { koiMsgError, koiNoticeError } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";
import UserSelectDialog from "@/components/Common/UserSelectDialog.vue";
import type { AppUser } from "@/api/appUser/type";

const loading = ref(false);
const tableData = ref<RedeemRecordView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const userDialogVisible = ref(false);
const selectedUser = ref<AppUser | null>(null);
const baseUrl = import.meta.env.VITE_SERVER;

// 查询参数
const searchParams = reactive<RedeemRecordListQuery>({
  page: 1,
  limit: 10,
  user_id: "",
  code: "",
  batch_no: "",
  status: "",
  redeemedAtFrom: "",
  redeemedAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const redeemedAtRange = ref<[string, string] | []>([]);

const columns = [
  { key: "user_id", label: "用户", defaultWidth: 180 },
  { key: "code", label: "兑换码", defaultWidth: 180 },
  { key: "batch_no", label: "批次号", defaultWidth: 180 },
  { key: "plan_id", label: "套餐ID", defaultWidth: 160 },
  { key: "duration_days", label: "时长(天)", defaultWidth: 120 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "fail_reason", label: "失败原因", defaultWidth: 160 },
  { key: "redeemedAt", label: "兑换时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-redeem-records",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 获取状态显示文本
const getStatusLabel = (value: string) => {
  return REDEEM_RECORD_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: string) => {
  return REDEEM_RECORD_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
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
    const res = await getRedeemRecordList(searchParams);
    tableData.value = (res.data || []).map((item: RedeemRecordView) => ({
      ...item,
      redeemedAt: formatDate(item.redeemedAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取兑换记录失败");
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
  searchParams.code = "";
  searchParams.batch_no = "";
  searchParams.status = "";
  searchParams.redeemedAtFrom = "";
  searchParams.redeemedAtTo = "";
  selectedUser.value = null;
  redeemedAtRange.value = [];
  fetchList();
};

// 兑换时间范围变化
const handleRedeemedAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.redeemedAtFrom = value[0];
    searchParams.redeemedAtTo = value[1];
  } else {
    searchParams.redeemedAtFrom = "";
    searchParams.redeemedAtTo = "";
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
  const header = ["用户ID", "兑换码", "批次号", "套餐ID", "时长(天)", "状态", "失败原因", "兑换时间"];
  const rows = tableData.value.map(item => [
    item.user_id,
    item.code,
    item.batch_no || "",
    item.plan_id,
    item.duration_days,
    getStatusLabel(item.status),
    item.fail_reason || "",
    item.redeemedAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "redeem-records.csv");
};

onMounted(() => {
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

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-avatar {
  background: #f2f3f5;
  color: #909399;
  font-size: 12px;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}
</style>
