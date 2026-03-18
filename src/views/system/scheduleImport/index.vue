<template>
  <div class="schedule-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>课表抓取配置</span>
          <div class="toolbar-actions">
            <el-button :loading="crawlLoading" type="primary" @click="handleManualCrawl">立即抓取</el-button>
            <el-button @click="loadAll">刷新</el-button>
          </div>
        </div>
      </template>

      <el-form :model="settingsForm" class="settings-form" inline label-width="110px">
        <el-form-item label="定时抓取开关">
          <el-switch v-model="settingsForm.enabled" />
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="settingsForm.cron_expr" placeholder="例如 0 0 6 * * *" style="width: 320px" />
        </el-form-item>
        <el-form-item label="学期起始时间">
          <el-date-picker
            v-model="settingsForm.term_start_date"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            clearable
            placeholder="请选择学期开始日期"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button :loading="settingsLoading" type="primary" @click="saveSettings">保存配置</el-button>
        </el-form-item>
      </el-form>
      <div class="settings-tip">
        系统会按账号排序依次尝试抓取，任一账号成功后本次任务结束。当前抓取结果会写入统一课表事实表，后续班级、教师、教室三种视角都会从同一份数据读取。
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>教务账号管理</span>
          <el-button type="primary" @click="openCreate">新增账号</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="accountQuery" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="accountQuery.keyword" clearable placeholder="按账号或备注搜索" />
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
        <el-table-column prop="username" label="教务账号" min-width="180" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近成功时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.last_success_at) }}</template>
        </el-table-column>
        <el-table-column prop="last_error_message" label="最近失败信息" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
      <template #header>抓取任务记录</template>
      <el-table v-loading="tasksLoading" :data="tasks" border>
        <el-table-column prop="id" label="任务ID" width="90" />
        <el-table-column prop="trigger_type" label="触发方式" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source_scope" label="抓取范围" width="110" />
        <el-table-column prop="source_key" label="来源标识" min-width="140" show-overflow-tooltip />
        <el-table-column prop="account_username" label="成功账号" min-width="140" />
        <el-table-column prop="attempt_count" label="尝试次数" width="100" />
        <el-table-column prop="imported_count" label="更新条数" width="100" />
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

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增教务账号' : '编辑教务账号'" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="教务账号" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item :prop="dialogMode === 'create' ? 'password' : ''" label="教务密码">
          <el-input
            v-model="form.password"
            show-password
            type="password"
            :placeholder="dialogMode === 'edit' ? '留空表示不修改' : '请输入教务密码'"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="taskDetailVisible" size="520px" title="抓取任务详情">
      <el-descriptions v-if="currentTask" :column="1" border>
        <el-descriptions-item label="任务ID">{{ currentTask.id }}</el-descriptions-item>
        <el-descriptions-item label="触发方式">{{ currentTask.trigger_type }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTask.status }}</el-descriptions-item>
        <el-descriptions-item label="抓取范围">{{ currentTask.source_scope || "-" }}</el-descriptions-item>
        <el-descriptions-item label="来源标识">{{ currentTask.source_key || "-" }}</el-descriptions-item>
        <el-descriptions-item label="成功账号">{{ currentTask.account_username || "-" }}</el-descriptions-item>
        <el-descriptions-item label="尝试次数">{{ currentTask.attempt_count }}</el-descriptions-item>
        <el-descriptions-item label="更新条数">{{ currentTask.imported_count }}</el-descriptions-item>
        <el-descriptions-item label="结果摘要">{{ currentTask.result_message || "-" }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{ currentTask.error_message || "-" }}</el-descriptions-item>
        <el-descriptions-item label="尝试日志">
          <div class="attempt-log">{{ currentTask.attempt_log || "-" }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(currentTask.started_at) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatTime(currentTask.finished_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { normalizePagination } from "@/api/common/pagination";
import {
  createScheduleAccount,
  deleteScheduleAccount,
  getScheduleAccountDetail,
  getScheduleAccounts,
  getScheduleSettings,
  getScheduleTaskDetail,
  getScheduleTasks,
  triggerScheduleCrawl,
  updateScheduleAccount,
  updateScheduleSettings,
  type ScheduleAccount,
  type ScheduleTask
} from "@/api/scheduleImport";

const accountsLoading = ref(false);
const tasksLoading = ref(false);
const settingsLoading = ref(false);
const crawlLoading = ref(false);
const submitLoading = ref(false);

const accountTotal = ref(0);
const taskTotal = ref(0);
const accounts = ref<ScheduleAccount[]>([]);
const tasks = ref<ScheduleTask[]>([]);
const currentTask = ref<ScheduleTask | null>(null);

const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const taskDetailVisible = ref(false);
const formRef = ref<FormInstance>();

const settingsForm = reactive({
  enabled: false,
  cron_expr: "0 0 6 * * *",
  term_start_date: ""
});

const accountQuery = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  status: undefined as boolean | undefined
});

const taskQuery = reactive({
  page: 1,
  limit: 10
});

const form = reactive({
  username: "",
  password: "",
  remark: "",
  sort: 0,
  status: true
});

const rules: FormRules = {
  username: [{ required: true, message: "请输入教务账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入教务密码", trigger: "blur" }]
};

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

const resetForm = () => {
  editingId.value = null;
  form.username = "";
  form.password = "";
  form.remark = "";
  form.sort = 0;
  form.status = true;
};

const loadAccounts = async () => {
  accountsLoading.value = true;
  try {
    const params: Record<string, any> = { ...accountQuery };
    if (params.status === undefined) delete params.status;
    const res = await getScheduleAccounts(params);
    accounts.value = res.data || [];
    accountTotal.value = normalizePagination(res).totalRecords || 0;
  } finally {
    accountsLoading.value = false;
  }
};

const loadSettings = async () => {
  const res = await getScheduleSettings();
  Object.assign(settingsForm, {
    enabled: false,
    cron_expr: "0 0 6 * * *",
    term_start_date: "",
    ...(res.data || {})
  });
};

const loadTasks = async () => {
  tasksLoading.value = true;
  try {
    const res = await getScheduleTasks(taskQuery);
    tasks.value = res.data || [];
    taskTotal.value = normalizePagination(res).totalRecords || 0;
  } finally {
    tasksLoading.value = false;
  }
};

const loadAll = async () => {
  await Promise.all([loadAccounts(), loadSettings(), loadTasks()]);
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

const saveSettings = async () => {
  settingsLoading.value = true;
  try {
    await updateScheduleSettings({
      enabled: settingsForm.enabled,
      cron_expr: settingsForm.cron_expr,
      term_start_date: settingsForm.term_start_date || ""
    });
    ElMessage.success("抓取配置已保存");
    await loadSettings();
  } finally {
    settingsLoading.value = false;
  }
};

const handleManualCrawl = async () => {
  crawlLoading.value = true;
  try {
    await triggerScheduleCrawl();
    ElMessage.success("已触发手动抓取");
  } finally {
    await loadTasks();
    crawlLoading.value = false;
  }
};

const openCreate = () => {
  dialogMode.value = "create";
  resetForm();
  dialogVisible.value = true;
};

const openEdit = async (row: ScheduleAccount) => {
  dialogMode.value = "edit";
  resetForm();
  const res = await getScheduleAccountDetail(row.id);
  const detail = res.data as ScheduleAccount;
  editingId.value = row.id;
  form.username = detail.username;
  form.remark = detail.remark || "";
  form.sort = detail.sort || 0;
  form.status = detail.status;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    if (dialogMode.value === "create") {
      await createScheduleAccount({
        username: form.username,
        password: form.password,
        remark: form.remark || undefined,
        sort: form.sort,
        status: form.status
      });
      ElMessage.success("教务账号创建成功");
    } else if (editingId.value) {
      const payload: Record<string, any> = {
        username: form.username,
        remark: form.remark || "",
        sort: form.sort,
        status: form.status
      };
      if (form.password) payload.password = form.password;
      await updateScheduleAccount(editingId.value, payload);
      ElMessage.success("教务账号更新成功");
    }
    dialogVisible.value = false;
    await loadAccounts();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = async (row: ScheduleAccount) => {
  await ElMessageBox.confirm(`确认删除教务账号 ${row.username} 吗？`, "删除确认", { type: "warning" });
  await deleteScheduleAccount(row.id);
  ElMessage.success("删除成功");
  await loadAccounts();
};

const openTaskDetail = async (id: number) => {
  const res = await getScheduleTaskDetail(id);
  currentTask.value = res.data;
  taskDetailVisible.value = true;
};

onMounted(loadAll);
</script>

<style scoped lang="scss">
.schedule-page {
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

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.settings-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 0;
}

.settings-tip {
  color: #7a8aa0;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.attempt-log {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
