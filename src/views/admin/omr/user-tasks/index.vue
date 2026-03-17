<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="searchParams.userId" class="filter-input" clearable placeholder="用户ID" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="searchParams.username" class="filter-input" clearable placeholder="用户名" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="searchParams.nickname" class="filter-input" clearable placeholder="昵称" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <ListToolbar
          v-model:showSearch="showSearch"
          :columns="columns"
          :column-state="columnState"
          @refresh="fetchList"
          @toggle-column="setVisible"
          @reset-columns="reset"
        >
          <template #left>
            <div class="toolbar-left">
              <el-button type="danger" plain icon="Delete" :loading="batchDeleting" :disabled="batchDeleting || !selectedTaskIds.length" @click="batchDeleteSelected">
                批量删除（{{ selectedTaskIds.length }}）
              </el-button>
              <el-input
                v-model="quickTaskId"
                class="quick-input"
                clearable
                placeholder="输入 taskId 直达详情"
                @keyup.enter.native="goToTaskDetailByTaskId(quickTaskId)"
              />
              <el-button type="primary" plain @click="goToTaskDetailByTaskId(quickTaskId)">打开</el-button>
            </div>
          </template>
        </ListToolbar>
      </el-row>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <UserTaskMappingTable
        v-else
        ref="mappingTableRef"
        :loading="loading"
        :table-data="tableData"
        :deleting-task-id="deletingTaskId"
        :get-visible="getVisible"
        :get-width="getWidth"
        @header-dragend="handleHeaderDragend"
        @selection-change="handleSelectionChange"
        @open="openTaskDetail"
        @copy="copyText"
        @delete="deleteTask"
      />

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
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { deleteOmrTask, getOmrUserTasks } from "@/api/omr/admin";
import type { OmrUserTaskItem } from "@/api/omr/admin/type";
import { batchDeleteOmrTasks } from "@/api/omr/tasks";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";
import UserTaskMappingTable from "@/views/admin/omr/user-tasks/components/UserTaskMappingTable.vue";
import { formatFileNamesText } from "@/utils/omr/fileType";

const router = useRouter();
const loading = ref(false);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const quickTaskId = ref("");
const searchParams = reactive({
  page: 1,
  limit: 20,
  userId: "",
  username: "",
  nickname: ""
});

const pagination = reactive({
  totalRecords: 0
});
const tableData = ref<OmrUserTaskItem[]>([]);
const columns = [
  { key: "userId", label: "用户ID", defaultWidth: 120 },
  { key: "username", label: "用户名", defaultWidth: 160 },
  { key: "nickname", label: "昵称", defaultWidth: 160 },
  { key: "fileType", label: "文件类型", defaultWidth: 130 },
  { key: "fileNames", label: "文件名", defaultWidth: 220 },
  { key: "taskId", label: "taskId", defaultWidth: 260 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 },
  { key: "updatedAt", label: "更新时间", defaultWidth: 180 }
];
const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings("admin-omr-user-tasks", columns);

const mappingTableRef = ref<{ clearSelection: () => void } | null>(null);
const selectedRows = ref<OmrUserTaskItem[]>([]);
const selectedTaskIds = computed(() => {
  const ids = selectedRows.value.map(item => String(item?.taskId || "").trim()).filter(Boolean);
  return Array.from(new Set(ids));
});

const buildQuery = () => {
  const limit = Number(searchParams.limit) || 20;
  const page = Number(searchParams.page) || 1;
  const offset = (page - 1) * limit;
  return {
    limit,
    offset,
    userId: searchParams.userId || undefined,
    username: searchParams.username || undefined,
    nickname: searchParams.nickname || undefined
  };
};

const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    selectedRows.value = [];
    mappingTableRef.value?.clearSelection();
    const res = await getOmrUserTasks(buildQuery());
    tableData.value = (Array.isArray(res.items) ? res.items : []).map(item => ({
      ...item,
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt)
    }));
    pagination.totalRecords = Number(res.total || 0);
  } catch (err) {
    const state = resolveRequestError(err, "获取列表失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchParams.page = 1;
  fetchList();
};

const resetSearch = () => {
  searchParams.page = 1;
  searchParams.limit = 20;
  searchParams.userId = "";
  searchParams.username = "";
  searchParams.nickname = "";
  fetchList();
};

const goToTaskDetailByTaskId = (taskId: string) => {
  const value = String(taskId || "").trim();
  if (!value) {
    koiMsgError("请输入 taskId");
    return;
  }
  router.push(`/admin/omr/tasks/${encodeURIComponent(value)}`);
};

const openTaskDetail = (row: OmrUserTaskItem) => {
  if (!row?.taskId) return;
  router.push({
    path: `/admin/omr/tasks/${encodeURIComponent(row.taskId)}`,
    query: {
      fileType: row.fileType || "",
      fileNames: formatFileNamesText(row.fileNames)
    }
  });
};

const handleSelectionChange = (rows: OmrUserTaskItem[]) => {
  selectedRows.value = rows;
};

const deletingTaskId = ref("");

const deleteTask = async (taskId: string) => {
  const value = String(taskId || "").trim();
  if (!value) return;
  try {
    await koiMsgBox("确认删除该任务？删除后不可恢复。", "确认操作");
  } catch {
    return;
  }
  try {
    deletingTaskId.value = value;
    await deleteOmrTask(value);
    koiNoticeSuccess("删除成功");
    fetchList();
  } catch (err) {
    const state = resolveRequestError(err, "删除失败");
    koiNoticeError(state.message);
  } finally {
    deletingTaskId.value = "";
  }
};

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    koiNoticeSuccess("复制成功");
  } catch {
    koiMsgError("复制失败");
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const batchDeleting = ref(false);

const batchDeleteSelected = async () => {
  if (batchDeleting.value) return;
  const taskIds = selectedTaskIds.value;
  if (!taskIds.length) return;
  try {
    await koiMsgBox(`确认批量删除任务？共 ${taskIds.length} 个。`, "确认操作");
  } catch {
    return;
  }
  try {
    batchDeleting.value = true;
    await batchDeleteOmrTasks({ taskIds });
    koiNoticeSuccess("删除已提交");
    fetchList();
  } catch (err) {
    const state = resolveRequestError(err, "删除失败");
    koiNoticeError(state.message);
  } finally {
    batchDeleting.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.filter-form {
  padding: 10px 0 0;
}
.filter-input {
  width: 200px;
}
.list-toolbar-row {
  margin-bottom: 12px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.quick-input {
  width: 260px;
}
.list-pagination {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
