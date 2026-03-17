<template>
  <div class="page-card">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar">
          <span>用户管理</span>
          <el-button type="primary" @click="openCreate">新增用户</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="账号">
          <el-input v-model="query.username" clearable placeholder="按账号筛选" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="query.nickname" clearable placeholder="按昵称筛选" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.user_state" clearable placeholder="全部">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" min-width="140" />
        <el-table-column prop="nickname" label="昵称" min-width="140" />
        <el-table-column prop="client_type" label="客户端类型" min-width="120" />
        <el-table-column prop="login_ip" label="最近登录IP" min-width="140" />
        <el-table-column prop="description" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.user_state === 1 ? 'success' : 'danger'">{{ row.user_state === 1 ? "启用" : "禁用" }}</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增用户' : '编辑用户'" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" :prop="dialogMode === 'create' ? 'password' : ''">
          <el-input v-model="form.password" type="password" show-password placeholder="编辑时留空表示不修改" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="头像地址">
          <el-input v-model="form.avatar" />
        </el-form-item>
        <el-form-item label="客户端类型">
          <el-input v-model="form.client_type" placeholder="例如 wechat / ios / android" />
        </el-form-item>
        <el-form-item label="登录IP">
          <el-input v-model="form.login_ip" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.user_state">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
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
import { createAppUser, deleteAppUserById, getAppUserList, updateAppUser } from "@/api/appUser";
import type { AppUser } from "@/api/appUser/type";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const total = ref(0);
const tableData = ref<AppUser[]>([]);
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  limit: 10,
  username: "",
  nickname: "",
  user_state: "" as number | ""
});

const form = reactive({
  username: "",
  password: "",
  nickname: "",
  avatar: "",
  client_type: "",
  login_ip: "",
  user_state: 1,
  description: ""
});

const rules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

const resetForm = () => {
  editingId.value = null;
  form.username = "";
  form.password = "";
  form.nickname = "";
  form.avatar = "";
  form.client_type = "";
  form.login_ip = "";
  form.user_state = 1;
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
    const params: Record<string, any> = { ...query };
    if (params.user_state === "") delete params.user_state;
    const res = await getAppUserList(params);
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
  query.username = "";
  query.nickname = "";
  query.user_state = "";
  loadList();
};

const openCreate = () => {
  dialogMode.value = "create";
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: AppUser) => {
  dialogMode.value = "edit";
  editingId.value = row.id;
  form.username = row.username;
  form.password = "";
  form.nickname = row.nickname;
  form.avatar = row.avatar || "";
  form.client_type = row.client_type || "";
  form.login_ip = row.login_ip || "";
  form.user_state = row.user_state;
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
      await createAppUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        avatar: form.avatar || undefined,
        client_type: form.client_type || undefined,
        description: form.description || undefined
      });
      ElMessage.success("新增成功");
    } else if (editingId.value) {
      const payload: Record<string, any> = {
        username: form.username,
        nickname: form.nickname,
        avatar: form.avatar || "",
        client_type: form.client_type || "",
        description: form.description || "",
        login_ip: form.login_ip || "",
        user_state: form.user_state
      };
      if (form.password) payload.password = form.password;
      await updateAppUser(editingId.value, payload);
      ElMessage.success("更新成功");
    }
    dialogVisible.value = false;
    loadList();
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (row: AppUser) => {
  await ElMessageBox.confirm(`确认删除用户 ${row.username} 吗？`, "删除确认", { type: "warning" });
  await deleteAppUserById(row.id);
  ElMessage.success("删除成功");
  loadList();
};

onMounted(loadList);
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
