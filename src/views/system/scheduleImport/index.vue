<template>
  <div class="page-card">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>课表导入</span>
          <el-button type="primary" :loading="uploading" @click="handleUpload">开始导入</el-button>
        </div>
      </template>

      <el-form label-width="100px" class="import-form">
        <el-form-item label="来源名称">
          <el-input v-model="form.source_name" placeholder="例如 2025-2026-2 学期" />
        </el-form-item>
        <el-form-item label="导入模式">
          <el-radio-group v-model="form.replace_mode">
            <el-radio :value="false">追加导入</el-radio>
            <el-radio :value="true">覆盖导入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="课表文件">
          <input ref="fileInputRef" type="file" accept=".html,.htm,.txt" @change="handleFileChange" />
          <span class="file-tip">{{ selectedFile ? selectedFile.name : "请选择课表 HTML 文件" }}</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>导入任务记录</template>
      <el-table v-loading="loading" :data="tasks" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="source_name" label="来源名称" min-width="140" />
        <el-table-column prop="file_name" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="imported_count" label="导入条数" width="110" />
        <el-table-column label="模式" width="110">
          <template #default="{ row }">{{ row.replace_mode ? "覆盖" : "追加" }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.limit"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="loadTasks"
          @current-change="loadTasks"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="导入任务详情" size="520px">
      <el-descriptions v-if="currentTask" :column="1" border>
        <el-descriptions-item label="任务ID">{{ currentTask.id }}</el-descriptions-item>
        <el-descriptions-item label="来源名称">{{ currentTask.source_name || "-" }}</el-descriptions-item>
        <el-descriptions-item label="文件名">{{ currentTask.file_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTask.status }}</el-descriptions-item>
        <el-descriptions-item label="导入条数">{{ currentTask.imported_count }}</el-descriptions-item>
        <el-descriptions-item label="导入模式">{{ currentTask.replace_mode ? "覆盖导入" : "追加导入" }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{ currentTask.error_message || "-" }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentTask.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(currentTask.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { normalizePagination } from "@/api/common/pagination";
import { getScheduleImportTaskDetail, getScheduleImportTasks, importSchedule, type ScheduleImportTask } from "@/api/scheduleImport";

const loading = ref(false);
const uploading = ref(false);
const total = ref(0);
const tasks = ref<ScheduleImportTask[]>([]);
const detailVisible = ref(false);
const currentTask = ref<ScheduleImportTask | null>(null);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const query = reactive({
  page: 1,
  limit: 10
});

const form = reactive({
  source_name: "",
  replace_mode: false
});

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const res = await getScheduleImportTasks(query);
    tasks.value = res.data || [];
    total.value = normalizePagination(res).totalRecords || 0;
  } finally {
    loading.value = false;
  }
};

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择课表文件");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile.value);
  formData.append("source_name", form.source_name);
  formData.append("replace_mode", String(form.replace_mode));

  uploading.value = true;
  try {
    await importSchedule(formData);
    ElMessage.success("导入成功");
    selectedFile.value = null;
    if (fileInputRef.value) fileInputRef.value.value = "";
    await loadTasks();
  } finally {
    uploading.value = false;
  }
};

const openDetail = async (id: number) => {
  const res = await getScheduleImportTaskDetail(id);
  currentTask.value = res.data;
  detailVisible.value = true;
};

onMounted(loadTasks);
</script>

<style scoped lang="scss">
.page-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.import-form {
  max-width: 720px;
}

.file-tip {
  margin-left: 12px;
  color: #7a8aa0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
