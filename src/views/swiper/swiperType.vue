<template>
  <div class="swiper-type-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>轮播图分类</span>
          <el-button type="primary" @click="openCreate">新增分类</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="class_name" label="分类名称" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增分类' : '编辑分类'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="分类名称" prop="class_name">
          <el-input v-model="form.class_name" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { createSwiperType, deleteSwiperType, getSwiperTypeList, updateSwiperType, type SwiperTypeItem } from "@/api/swiper/swiperType";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const tableData = ref<SwiperTypeItem[]>([]);
const formRef = ref<FormInstance>();

const form = reactive({
  class_name: "",
  description: ""
});

const rules: FormRules = {
  class_name: [{ required: true, message: "请输入分类名称", trigger: "blur" }]
};

const resetForm = () => {
  editingId.value = null;
  form.class_name = "";
  form.description = "";
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const loadList = async () => {
  loading.value = true;
  try {
    const res = await getSwiperTypeList();
    tableData.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  dialogMode.value = "create";
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: SwiperTypeItem) => {
  dialogMode.value = "edit";
  editingId.value = row.id;
  form.class_name = row.class_name;
  form.description = row.description || "";
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (dialogMode.value === "create") {
      await createSwiperType({ class_name: form.class_name, description: form.description || undefined });
      ElMessage.success("新增成功");
    } else if (editingId.value) {
      await updateSwiperType(editingId.value, { class_name: form.class_name, description: form.description || undefined });
      ElMessage.success("更新成功");
    }
    dialogVisible.value = false;
    loadList();
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (row: SwiperTypeItem) => {
  await ElMessageBox.confirm(`确认删除分类 ${row.class_name} 吗？`, "删除确认", { type: "warning" });
  await deleteSwiperType(row.id);
  ElMessage.success("删除成功");
  loadList();
};

onMounted(loadList);
</script>

<style scoped lang="scss">
.swiper-type-page {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
