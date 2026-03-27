<template>
  <div class="score-sync-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>成绩同步概览</span>
          <el-button @click="loadAll">刷新</el-button>
        </div>
      </template>
      <div class="summary-tip">
        成绩数据已改为“绑定校验后落库、查询时优先读缓存、缓存过期再回源同步”。本页用于查看共享教务账号的缓存覆盖情况和同步任务结果。
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>教务账号缓存状态</template>

      <el-form :inline="true" :model="accountQuery" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="accountQuery.keyword" clearable placeholder="教务账号或错误信息" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="accountQuery.status" clearable placeholder="全部" style="width: 140px">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearchAccounts">查询</el-button>
          <el-button @click="handleResetAccounts">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="accountsLoading" :data="accounts" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="教务账号" min-width="160" />
        <el-table-column prop="credential_version" label="凭据版本" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bound_user_count" label="绑定用户数" width="110" />
        <el-table-column prop="term_count" label="学期缓存数" width="110" />
        <el-table-column prop="synced_term_count" label="成绩缓存学期数" width="140" />
        <el-table-column prop="has_score_term_count" label="有成绩学期数" width="120" />
        <el-table-column prop="empty_term_count" label="空成绩学期数" width="120" />
        <el-table-column label="最近验证时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.last_verified_at) }}</template>
        </el-table-column>
        <el-table-column label="最近成功时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.last_success_at) }}</template>
        </el-table-column>
        <el-table-column label="最近学期同步" min-width="180">
          <template #default="{ row }">{{ formatTime(row.last_term_synced_at) }}</template>
        </el-table-column>
        <el-table-column label="最近成绩探测" min-width="180">
          <template #default="{ row }">{{ formatTime(row.last_score_scanned_at) }}</template>
        </el-table-column>
        <el-table-column label="最近成绩同步" min-width="180">
          <template #default="{ row }">{{ formatTime(row.last_score_synced_at) }}</template>
        </el-table-column>
        <el-table-column prop="last_error_message" label="最近错误" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSyncDialog(row)">手动同步</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="accountQuery.page"
          v-model:page-size="accountQuery.limit"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="accountTotal"
          @size-change="loadAccounts"
          @current-change="loadAccounts"
        />
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>成绩同步任务</template>

      <el-form :inline="true" :model="taskQuery" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="taskQuery.keyword" clearable placeholder="教务账号、学期或错误信息" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="taskQuery.status" clearable placeholder="全部" style="width: 140px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="进行中" value="running" />
          </el-select>
        </el-form-item>
        <el-form-item label="同步范围">
          <el-select v-model="taskQuery.sync_scope" clearable placeholder="全部" style="width: 140px">
            <el-option label="学期" value="terms" />
            <el-option label="成绩" value="scores" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发来源">
          <el-select v-model="taskQuery.trigger_type" clearable placeholder="全部" style="width: 140px">
            <el-option label="绑定预热" value="bind" />
            <el-option label="读取触发" value="read" />
            <el-option label="后台手动" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearchTasks">查询</el-button>
          <el-button @click="handleResetTasks">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="tasksLoading" :data="tasks" border>
        <el-table-column prop="id" label="任务ID" width="90" />
        <el-table-column prop="jw_username" label="教务账号" min-width="150" />
        <el-table-column prop="trigger_type" label="触发来源" width="100" />
        <el-table-column prop="sync_scope" label="同步范围" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="term_code" label="学期" min-width="120" />
        <el-table-column prop="imported_count" label="写入条数" width="100" />
        <el-table-column label="开始时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.started_at) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.finished_at) }}</template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openTaskDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="taskQuery.page"
          v-model:page-size="taskQuery.limit"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="taskTotal"
          @size-change="loadTasks"
          @current-change="loadTasks"
        />
      </div>
    </el-card>

    <el-drawer v-model="taskDetailVisible" size="520px" title="成绩同步任务详情">
      <el-descriptions v-if="currentTask" :column="1" border>
        <el-descriptions-item label="任务ID">{{ currentTask.id }}</el-descriptions-item>
        <el-descriptions-item label="教务账号">{{ currentTask.jw_username }}</el-descriptions-item>
        <el-descriptions-item label="触发来源">{{ currentTask.trigger_type }}</el-descriptions-item>
        <el-descriptions-item label="同步范围">{{ currentTask.sync_scope }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTask.status }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentTask.user_id ?? "-" }}</el-descriptions-item>
        <el-descriptions-item label="教务账号ID">{{ currentTask.jw_account_id }}</el-descriptions-item>
        <el-descriptions-item label="学期">{{ currentTask.term_code || "-" }}</el-descriptions-item>
        <el-descriptions-item label="写入条数">{{ currentTask.imported_count }}</el-descriptions-item>
        <el-descriptions-item label="结果摘要">{{ currentTask.result_message || "-" }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{ currentTask.error_message || "-" }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(currentTask.started_at) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatTime(currentTask.finished_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="syncDialogVisible" title="手动同步成绩缓存" width="520px">
      <el-form :model="syncForm" label-width="110px">
        <el-form-item label="教务账号">
          <span>{{ syncTarget?.username || "-" }}</span>
        </el-form-item>
        <el-form-item label="同步范围">
          <el-select v-model="syncForm.scope" style="width: 100%">
            <el-option label="仅刷新学期列表" value="terms" />
            <el-option label="刷新默认学期成绩" value="default_scores" />
            <el-option label="刷新指定学期成绩" value="term_scores" />
            <el-option label="扫描全部学期成绩" value="all_scores" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="syncForm.scope === 'term_scores'" label="学期代码">
          <el-input v-model="syncForm.term_code" placeholder="例如 2025-2026-2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="syncDialogVisible = false">取消</el-button>
        <el-button :loading="syncSubmitting" type="primary" @click="handleManualSync">开始同步</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { normalizePagination } from "@/api/common/pagination";
import {
  getScoreSyncAccounts,
  getScoreSyncTaskDetail,
  getScoreSyncTasks,
  triggerScoreManualSync,
  type ScoreSyncAccount,
  type ScoreSyncTask
} from "@/api/scoreSync";

const accountsLoading = ref(false);
const tasksLoading = ref(false);
const accountTotal = ref(0);
const taskTotal = ref(0);
const accounts = ref<ScoreSyncAccount[]>([]);
const tasks = ref<ScoreSyncTask[]>([]);
const currentTask = ref<ScoreSyncTask | null>(null);
const taskDetailVisible = ref(false);
const syncDialogVisible = ref(false);
const syncSubmitting = ref(false);
const syncTarget = ref<ScoreSyncAccount | null>(null);

const accountQuery = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  status: undefined as boolean | undefined
});

const taskQuery = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  status: "",
  sync_scope: "",
  trigger_type: ""
});

const syncForm = reactive({
  scope: "default_scores" as "terms" | "default_scores" | "term_scores" | "all_scores",
  term_code: ""
});

const formatTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const tagType = (status?: string) => {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "warning";
};

const loadAccounts = async () => {
  accountsLoading.value = true;
  try {
    const params: Record<string, any> = { ...accountQuery };
    if (params.status === undefined) delete params.status;
    const res = await getScoreSyncAccounts(params);
    accounts.value = res.data || [];
    accountTotal.value = normalizePagination(res).totalRecords || 0;
  } finally {
    accountsLoading.value = false;
  }
};

const loadTasks = async () => {
  tasksLoading.value = true;
  try {
    const params: Record<string, any> = { ...taskQuery };
    if (!params.status) delete params.status;
    if (!params.sync_scope) delete params.sync_scope;
    if (!params.trigger_type) delete params.trigger_type;
    const res = await getScoreSyncTasks(params);
    tasks.value = res.data || [];
    taskTotal.value = normalizePagination(res).totalRecords || 0;
  } finally {
    tasksLoading.value = false;
  }
};

const loadAll = async () => {
  await Promise.all([loadAccounts(), loadTasks()]);
};

const handleSearchAccounts = () => {
  accountQuery.page = 1;
  loadAccounts();
};

const handleResetAccounts = () => {
  accountQuery.page = 1;
  accountQuery.limit = 10;
  accountQuery.keyword = "";
  accountQuery.status = undefined;
  loadAccounts();
};

const handleSearchTasks = () => {
  taskQuery.page = 1;
  loadTasks();
};

const handleResetTasks = () => {
  taskQuery.page = 1;
  taskQuery.limit = 10;
  taskQuery.keyword = "";
  taskQuery.status = "";
  taskQuery.sync_scope = "";
  taskQuery.trigger_type = "";
  loadTasks();
};

const openSyncDialog = (row: ScoreSyncAccount) => {
  syncTarget.value = row;
  syncForm.scope = "default_scores";
  syncForm.term_code = "";
  syncDialogVisible.value = true;
};

const handleManualSync = async () => {
  if (!syncTarget.value) return;
  if (syncForm.scope === "term_scores" && !syncForm.term_code.trim()) {
    ElMessage.warning("请输入学期代码");
    return;
  }

  syncSubmitting.value = true;
  try {
    const res = await triggerScoreManualSync(syncTarget.value.id, {
      scope: syncForm.scope,
      term_code: syncForm.scope === "term_scores" ? syncForm.term_code.trim() : undefined
    });
    const data = res.data || {};
    const termCode = data.term_code ? `，学期 ${data.term_code}` : "";
    ElMessage.success(`已完成手动同步：${data.scope || syncForm.scope}${termCode}`);
    syncDialogVisible.value = false;
    await loadAll();
  } finally {
    syncSubmitting.value = false;
  }
};

const openTaskDetail = async (id: number) => {
  const res = await getScoreSyncTaskDetail(id);
  currentTask.value = res.data;
  taskDetailVisible.value = true;
};

onMounted(loadAll);
</script>

<style scoped lang="scss">
.score-sync-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar,
.search-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-tip {
  color: #7a8aa0;
  font-size: 13px;
  line-height: 1.7;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
