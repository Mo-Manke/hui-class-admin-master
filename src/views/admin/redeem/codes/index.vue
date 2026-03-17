<!-- 文件用途：兑换码管理页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="兑换码" prop="code">
          <el-input v-model="searchParams.code" class="filter-input" clearable placeholder="兑换码" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="批次号" prop="batch_no">
          <el-input v-model="searchParams.batch_no" class="filter-input" clearable placeholder="批次号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in REDEEM_CODE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用者" prop="used_by_user_id">
          <div class="user-picker">
            <el-button type="primary" plain @click="openUserDialog">选择用户</el-button>
            <div v-if="selectedUser || searchParams.used_by_user_id" class="user-picker__value">
              <span class="user-picker__text">
                {{ selectedUser ? `${selectedUser.nickname || selectedUser.username} (#${selectedUser.id})` : `ID: ${searchParams.used_by_user_id}` }}
              </span>
              <el-button type="danger" link @click="clearSelectedUser">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
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
        <el-table-column v-if="getVisible('code')" column-key="code" label="兑换码" prop="code" align="center" :min-width="getWidth('code', 180)" />
        <el-table-column v-if="getVisible('batch_no')" column-key="batch_no" label="批次号" prop="batch_no" align="center" :min-width="getWidth('batch_no', 180)" />
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('used_by_user_id')" column-key="used_by_user_id" label="使用者" prop="used_by_user_id" align="center" :width="getWidth('used_by_user_id', 180)">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.used_by_user?.avatar)" class="user-avatar">
                {{ row.used_by_user?.nickname?.slice(0, 1) || row.used_by_user?.username?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="user-name">{{ row.used_by_user?.nickname || row.used_by_user?.username || row.used_by_user_id || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('usedAt')" column-key="usedAt" label="使用时间" prop="usedAt" align="center" :width="getWidth('usedAt', 180)">
          <template #default="{ row }">{{ formatDate(row.usedAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" :width="160">
          <template #default="{ row }">
            <el-button v-if="row.status === 'NEW'" type="danger" link @click="handleVoid(row)">作废</el-button>
            <el-button v-if="row.status === 'USED'" type="primary" link @click="goToRecords(row)">兑换记录</el-button>
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
import { useRoute, useRouter } from "vue-router";
import { Close } from "@element-plus/icons-vue";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { REDEEM_CODE_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { getRedeemCodeList, voidRedeemCode } from "@/api/redeem/codes";
import type { RedeemCodeListQuery, RedeemCodeView } from "@/api/redeem/codes/type";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";
import UserSelectDialog from "@/components/Common/UserSelectDialog.vue";
import type { AppUser } from "@/api/appUser/type";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const tableData = ref<RedeemCodeView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const userDialogVisible = ref(false);
const selectedUser = ref<AppUser | null>(null);
const baseUrl = import.meta.env.VITE_SERVER;

// 查询参数
const searchParams = reactive<RedeemCodeListQuery>({
  page: 1,
  limit: 10,
  code: "",
  batch_no: "",
  status: "",
  used_by_user_id: "",
  createdAtFrom: "",
  createdAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const createdAtRange = ref<[string, string] | []>([]);

const columns = [
  { key: "code", label: "兑换码", defaultWidth: 180 },
  { key: "batch_no", label: "批次号", defaultWidth: 180 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "used_by_user_id", label: "使用者", defaultWidth: 180 },
  { key: "usedAt", label: "使用时间", defaultWidth: 180 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-redeem-codes",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 获取状态显示文本
const getStatusLabel = (value: string) => {
  return REDEEM_CODE_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: string) => {
  return REDEEM_CODE_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
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
    const res = await getRedeemCodeList(searchParams);
    tableData.value = (res.data || []).map((item: RedeemCodeView) => ({
      ...item,
      usedAt: formatDate(item.usedAt),
      createdAt: formatDate(item.createdAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取兑换码列表失败");
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
  searchParams.code = "";
  searchParams.batch_no = "";
  searchParams.status = "";
  searchParams.used_by_user_id = "";
  selectedUser.value = null;
  searchParams.createdAtFrom = "";
  searchParams.createdAtTo = "";
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

// 作废兑换码
const handleVoid = (row: RedeemCodeView) => {
  koiMsgBox(`确认作废兑换码【${row.code}】？`)
    .then(async () => {
      try {
        await voidRedeemCode(row.id, {});
        koiNoticeSuccess("作废成功");
        fetchList();
      } catch (error) {
        const state = resolveRequestError(error, "作废失败");
        koiNoticeError(state.message);
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

// 跳转兑换记录
const goToRecords = (row: RedeemCodeView) => {
  router.push({ path: "/admin/redeem/records", query: { code: row.code } });
};

const openUserDialog = () => {
  userDialogVisible.value = true;
};

const handleSelectUser = (row: AppUser) => {
  selectedUser.value = row;
  searchParams.used_by_user_id = String(row.id);
  userDialogVisible.value = false;
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  searchParams.used_by_user_id = "";
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
  const header = ["兑换码", "批次号", "状态", "使用者", "使用时间", "创建时间"];
  const rows = tableData.value.map(item => [
    item.code,
    item.batch_no || "",
    getStatusLabel(item.status),
    item.used_by_user_id || "",
    item.usedAt || "-",
    item.createdAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "codes.csv");
};

onMounted(() => {
  if (route.query.batch_no) {
    searchParams.batch_no = String(route.query.batch_no || "");
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
