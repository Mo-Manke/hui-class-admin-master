<template>
  <div class="koi-flex">
    <KoiCard>
      <div class="mb-2">
        <el-button type="primary" icon="plus" plain @click="handleAdd">新增等级</el-button>
      </div>

      <el-table :data="list" border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="等级名称" align="center" :min-width="160" :show-overflow-tooltip="true" />
        <el-table-column prop="title" label="等级称号" align="center" :min-width="160" :show-overflow-tooltip="true" />
        <el-table-column prop="daily_cap" label="每日上限" width="120" align="center" />
        <el-table-column prop="min_exp" label="最小经验" width="120" align="center" />
        <el-table-column prop="max_exp" label="最大经验" width="120" align="center" />
        <el-table-column prop="color_hex" label="颜色" align="center" :min-width="140">
          <template #default="{ row }">
            <div class="flex items-center justify-center">
              <span class="color-dot" :style="{ background: row.color_hex || '#999' }"></span>
              <span>{{ row.color_hex || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">修改</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <KoiDrawer ref="drawerRef" :title="drawerTitle" @koiConfirm="handleConfirm" @koiCancel="handleCancel" :loading="confirmLoading">
        <template #content>
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" status-icon>
            <el-form-item label="等级名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入等级名称" clearable />
            </el-form-item>
            <el-form-item label="等级称号" prop="title">
              <el-input v-model="form.title" placeholder="请输入等级称号" clearable />
            </el-form-item>
            <el-form-item label="每日上限" prop="daily_cap">
              <el-input-number v-model="form.daily_cap" :min="0" controls-position="right" placeholder="0为不限" />
            </el-form-item>
            <el-form-item label="最小经验" prop="min_exp">
              <el-input-number v-model="form.min_exp" :min="0" controls-position="right" />
            </el-form-item>
            <el-form-item label="最大经验" prop="max_exp">
              <el-input-number v-model="form.max_exp" :min="0" controls-position="right" />
            </el-form-item>
            <el-form-item label="颜色HEX" prop="color_hex">
              <el-input v-model="form.color_hex" placeholder="#RRGGBB，如 #FF9900" clearable />
            </el-form-item>
          </el-form>
        </template>
      </KoiDrawer>
    </KoiCard>
  </div>
</template>

<script setup lang="js">
import { ref, reactive, onMounted } from 'vue';
import { getExpLevels, createExpLevel, updateExpLevel, deleteExpLevel } from '@/api/expLevels/index.js';
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from '@/utils/koi.ts';

const loading = ref(false);
const list = ref([]);
const drawerRef = ref();
const drawerTitle = ref('新增等级');
const confirmLoading = ref(false);
const formRef = ref();

const form = ref({
  id: null,
  name: '',
  title: '',
  daily_cap: 0,
  min_exp: 0,
  max_exp: 0,
  color_hex: ''
});

const rules = reactive({
  name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  daily_cap: [{ required: true, message: '请输入每日上限', trigger: 'change' }],
  min_exp: [{ required: true, message: '请输入最小经验', trigger: 'change' }],
  max_exp: [{ required: true, message: '请输入最大经验', trigger: 'change' }]
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getExpLevels();
    list.value = res?.data || [];
  } catch (e) {
    koiNoticeError('加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  formRef.value && formRef.value.resetFields && formRef.value.resetFields();
  form.value = { id: null, name: '', title: '', daily_cap: 0, min_exp: 0, max_exp: 0, color_hex: '' };
}

function handleAdd() {
  resetForm();
  drawerTitle.value = '新增等级';
  drawerRef.value.koiOpen();
}

function handleEdit(row) {
  resetForm();
  form.value = { ...row };
  drawerTitle.value = '修改等级';
  drawerRef.value.koiOpen();
}

async function handleDelete(row) {
  await koiMsgBox(`确认删除等级 [${row.name}] 吗？`)
    .then(async () => {
      try {
        await deleteExpLevel(row.id);
        koiNoticeSuccess('删除成功');
        await fetchList();
      } catch (e) {
        koiNoticeError('删除失败，请稍后重试');
      }
    })
    .catch(() => {
      koiMsgError('已取消');
    });
}

function handleCancel() {
  drawerRef.value.koiClose();
}

function handleConfirm() {
  if (!formRef.value) return;
  confirmLoading.value = true;
  formRef.value.validate(async (valid) => {
    if (!valid) {
      koiMsgError('验证失败，请检查填写内容');
      confirmLoading.value = false;
      return;
    }
    try {
      const { id, ...payload } = form.value;
      if (id == null) {
        await createExpLevel(payload);
        koiNoticeSuccess('创建成功');
      } else {
        await updateExpLevel(id, payload);
        koiNoticeSuccess('更新成功');
      }
      confirmLoading.value = false;
      drawerRef.value.koiQuickClose();
      resetForm();
      await fetchList();
    } catch (e) {
      confirmLoading.value = false;
      koiNoticeError('操作失败，请稍后重试');
    }
  });
}

onMounted(fetchList);
</script>

<style scoped>
.mb-2 { margin-bottom: 8px; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.color-dot { display: inline-block; width: 12px; height: 12px; border-radius: 999px; margin-right: 8px; border: 1px solid #ddd; }
</style>
