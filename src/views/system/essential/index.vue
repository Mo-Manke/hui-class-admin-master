<template>
  <div class="essential-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>配置管理</span>
          <el-button type="primary" @click="openCreate">新增配置</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="配置键或说明" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.config_type" clearable placeholder="全部">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="config_key" label="配置键" min-width="180" />
        <el-table-column prop="config_type" label="类型" width="120" />
        <el-table-column prop="config_value" label="配置值" min-width="260" show-overflow-tooltip />
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <ConfigEditDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :record="currentRecord"
      :type-options="typeOptions"
      :loading="submitting"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { normalizePagination } from "@/api/common/pagination";
import { createAppConfig, getAppConfigList, updateAppConfig } from "@/api/system/appConfigs";
import type { AppConfigCreateRequest, AppConfigUpdateRequest, AppConfigView } from "@/api/system/appConfigs/type";
import ConfigEditDialog from "./components/ConfigEditDialog.vue";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const currentRecord = ref<AppConfigView | null>(null);
const tableData = ref<AppConfigView[]>([]);
const total = ref(0);

const query = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  config_type: ""
});

const typeOptions = [
  { label: "字符串", value: "string" },
  { label: "整数", value: "int" },
  { label: "布尔", value: "boolean" },
  { label: "浮点", value: "float" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "md" },
  { label: "富文本", value: "richtext" }
];

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const loadList = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = { ...query };
    if (!params.config_type) delete params.config_type;
    const res = await getAppConfigList(params);
    tableData.value = res.data || [];
    total.value = normalizePagination(res).totalRecords || 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  query.page = 1;
  loadList();
};

const handleReset = () => {
  query.page = 1;
  query.limit = 10;
  query.keyword = "";
  query.config_type = "";
  loadList();
};

const openCreate = () => {
  dialogMode.value = "create";
  currentRecord.value = null;
  dialogVisible.value = true;
};

const openEdit = (row: AppConfigView) => {
  dialogMode.value = "edit";
  currentRecord.value = row;
  dialogVisible.value = true;
};

const handleSubmit = async (payload: {
  mode: "create" | "edit";
  id?: number | null;
  data: { config_key: string; config_type: string; config_value: string; description?: string | null };
}) => {
  submitting.value = true;
  try {
    if (payload.mode === "create") {
      const params: AppConfigCreateRequest = {
        config_key: payload.data.config_key,
        config_type: payload.data.config_type,
        config_value: payload.data.config_value,
        description: payload.data.description || null
      };
      await createAppConfig(params);
      ElMessage.success("新增成功");
    } else if (payload.id) {
      const params: AppConfigUpdateRequest = {
        config_type: payload.data.config_type,
        config_value: payload.data.config_value,
        description: payload.data.description || null
      };
      await updateAppConfig(payload.id, params);
      ElMessage.success("更新成功");
    }
    dialogVisible.value = false;
    loadList();
  } finally {
    submitting.value = false;
  }
};

onMounted(loadList);
</script>

<style scoped lang="scss">
.essential-page {
  display: flex;
  flex-direction: column;
}

.toolbar,
.search-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
