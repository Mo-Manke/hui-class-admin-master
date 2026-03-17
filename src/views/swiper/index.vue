<template>
  <div class="page-card">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>轮播图列表</span>
          <el-button type="primary" @click="openCreate">新增轮播图</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="分类">
          <el-select v-model="query.swiper_class_id" clearable placeholder="全部分类" style="width: 220px">
            <el-option v-for="item in typeOptions" :key="item.id" :label="item.class_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="swiper_image" label="图片地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="swiper_title" label="标题" min-width="140" />
        <el-table-column prop="swiper_subtitle" label="副标题" min-width="160" />
        <el-table-column prop="swiper_url" label="跳转地址" min-width="180" show-overflow-tooltip />
        <el-table-column label="分类" min-width="140">
          <template #default="{ row }">{{ row.swiper_class?.class_name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="swiper_sort" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.swiper_use_state ? 'success' : 'danger'">{{ row.swiper_use_state ? "启用" : "禁用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增轮播图' : '编辑轮播图'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="图片地址" prop="swiper_image">
          <el-input v-model="form.swiper_image" placeholder="填写图片 URL 或文件路径" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.swiper_title" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.swiper_subtitle" />
        </el-form-item>
        <el-form-item label="跳转地址">
          <el-input v-model="form.swiper_url" />
        </el-form-item>
        <el-form-item label="分类" prop="swiper_class_id">
          <el-select v-model="form.swiper_class_id" style="width: 100%">
            <el-option v-for="item in typeOptions" :key="item.id" :label="item.class_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.swiper_sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.swiper_use_state" />
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
import { normalizePagination } from "@/api/common/pagination";
import { createSwiper, deleteSwiperById, getSwiperList, updateSwiper, type SwiperItem } from "@/api/swiper";
import { getSwiperTypeList, type SwiperTypeItem } from "@/api/swiper/swiperType";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const total = ref(0);
const tableData = ref<SwiperItem[]>([]);
const typeOptions = ref<SwiperTypeItem[]>([]);
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  limit: 10,
  swiper_class_id: "" as number | ""
});

const form = reactive({
  swiper_image: "",
  swiper_title: "",
  swiper_subtitle: "",
  swiper_url: "",
  swiper_sort: 0,
  swiper_use_state: true,
  description: "",
  swiper_class_id: undefined as number | undefined
});

const rules: FormRules = {
  swiper_image: [{ required: true, message: "请输入图片地址", trigger: "blur" }],
  swiper_class_id: [{ required: true, message: "请选择分类", trigger: "change" }]
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const resetForm = () => {
  editingId.value = null;
  form.swiper_image = "";
  form.swiper_title = "";
  form.swiper_subtitle = "";
  form.swiper_url = "";
  form.swiper_sort = 0;
  form.swiper_use_state = true;
  form.description = "";
  form.swiper_class_id = undefined;
};

const loadTypes = async () => {
  const res = await getSwiperTypeList();
  typeOptions.value = res.data || [];
};

const loadList = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = { ...query };
    if (params.swiper_class_id === "") delete params.swiper_class_id;
    const res = await getSwiperList(params);
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
  query.swiper_class_id = "";
  loadList();
};

const openCreate = () => {
  dialogMode.value = "create";
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: SwiperItem) => {
  dialogMode.value = "edit";
  editingId.value = row.id;
  form.swiper_image = row.swiper_image;
  form.swiper_title = row.swiper_title || "";
  form.swiper_subtitle = row.swiper_subtitle || "";
  form.swiper_url = row.swiper_url || "";
  form.swiper_sort = row.swiper_sort || 0;
  form.swiper_use_state = row.swiper_use_state;
  form.description = row.description || "";
  form.swiper_class_id = row.swiper_class_id;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid || !form.swiper_class_id) return;

  submitting.value = true;
  try {
    const payload = {
      swiper_image: form.swiper_image,
      swiper_title: form.swiper_title || "",
      swiper_subtitle: form.swiper_subtitle || "",
      swiper_url: form.swiper_url || "",
      swiper_sort: form.swiper_sort,
      swiper_use_state: form.swiper_use_state,
      description: form.description || "",
      swiper_class_id: form.swiper_class_id
    };

    if (dialogMode.value === "create") {
      await createSwiper(payload);
      ElMessage.success("新增成功");
    } else if (editingId.value) {
      await updateSwiper(editingId.value, payload);
      ElMessage.success("更新成功");
    }

    dialogVisible.value = false;
    loadList();
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (row: SwiperItem) => {
  await ElMessageBox.confirm(`确认删除轮播图 #${row.id} 吗？`, "删除确认", { type: "warning" });
  await deleteSwiperById(row.id);
  ElMessage.success("删除成功");
  loadList();
};

onMounted(async () => {
  await loadTypes();
  await loadList();
});
</script>

<style scoped lang="scss">
.page-card {
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
