<!-- 会员套餐列表页 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="searchParams.keyword"
            class="filter-input"
            clearable
            placeholder="套餐编码/名称"
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <el-col :span="1.5">
          <el-button type="primary" icon="Plus" plain @click="openCreate">新建套餐</el-button>
        </el-col>
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
        <el-table-column
          v-if="getVisible('id')"
          column-key="id"
          label="ID"
          prop="id"
          align="center"
          :width="getWidth('id', 80)"
          sortable="custom"
        />
        <el-table-column
          v-if="getVisible('plan_code')"
          column-key="plan_code"
          label="套餐编码"
          prop="plan_code"
          align="center"
          :width="getWidth('plan_code', 140)"
          sortable="custom"
        />
        <el-table-column
          v-if="getVisible('plan_name')"
          column-key="plan_name"
          label="套餐名称"
          prop="plan_name"
          align="center"
          :min-width="getWidth('plan_name', 160)"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="getVisible('plan_level')"
          column-key="plan_level"
          label="等级"
          prop="plan_level"
          align="center"
          :width="getWidth('plan_level', 90)"
          sortable="custom"
        />
        <el-table-column
          v-if="getVisible('status')"
          column-key="status"
          label="状态"
          prop="status"
          align="center"
          :width="getWidth('status', 100)"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="getVisible('remark')"
          column-key="remark"
          label="备注"
          prop="remark"
          align="center"
          :min-width="getWidth('remark', 160)"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="getVisible('createdAt')"
          column-key="createdAt"
          label="创建时间"
          prop="createdAt"
          align="center"
          :width="getWidth('createdAt', 180)"
          sortable="custom"
        />
        <el-table-column
          v-if="getVisible('updatedAt')"
          column-key="updatedAt"
          label="更新时间"
          prop="updatedAt"
          align="center"
          :width="getWidth('updatedAt', 180)"
          sortable="custom"
        />
        <el-table-column label="操作" align="center" fixed="right" :width="240">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" icon="Edit" circle plain @click="openEdit(row)" />
              </el-tooltip>
              <el-tooltip content="启用/禁用" placement="top">
                <el-button type="warning" icon="Switch" circle plain @click="toggleStatus(row)" />
              </el-tooltip>
              <el-dropdown>
                <el-button type="info" icon="More" circle plain />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToPrices(row)">查看价格</el-dropdown-item>
                    <el-dropdown-item @click="emit('show-entitlements', row.id)">权益配置</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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

      <KoiDrawer ref="drawerRef" :title="drawerTitle" :loading="confirmLoading" @koiConfirm="handleConfirm" @koiCancel="handleCancel">
        <template #content>
          <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" status-icon>
            <el-form-item label="套餐编码" prop="plan_code">
              <el-input v-model="form.plan_code" :disabled="formType === 'edit'" placeholder="如 VIP" />
            </el-form-item>
            <el-form-item label="套餐名称" prop="plan_name">
              <el-input v-model="form.plan_name" placeholder="如 VIP会员" />
            </el-form-item>
            <el-form-item label="套餐等级" prop="plan_level">
              <el-input-number v-model="form.plan_level" :min="1" class="number-input" />
              <div class="form-tip">等级调整会影响升级排序</div>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选备注" />
            </el-form-item>
          </el-form>
        </template>
      </KoiDrawer>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { createPlan, getPlanList, updatePlan, updatePlanStatus } from "@/api/membership/plans";
import type { PlanView } from "@/api/membership/plans/type";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useDebouncedSubmit } from "@/hooks/form/useDebouncedSubmit";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";

const emit = defineEmits<{
  (event: "show-entitlements", planId: number): void;
}>();

const router = useRouter();
const loading = ref(false);
const tableData = ref<PlanView[]>([]);
const showSearch = ref(true);
const confirmLoading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);
const drawerTitle = ref("新建套餐");
const formType = ref<"create" | "edit">("create");
const formRef = ref();
const drawerRef = ref();

const searchParams = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  status: ""
});

const pagination = reactive({
  totalRecords: 0
});

const columns = [
  { key: "id", label: "ID", defaultWidth: 80 },
  { key: "plan_code", label: "套餐编码", defaultWidth: 140 },
  { key: "plan_name", label: "套餐名称", defaultWidth: 160 },
  { key: "plan_level", label: "等级", defaultWidth: 90 },
  { key: "status", label: "状态", defaultWidth: 100 },
  { key: "remark", label: "备注", defaultWidth: 160 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 },
  { key: "updatedAt", label: "更新时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-membership-plans",
  columns
);

const resetColumns = () => {
  reset();
};

const form = reactive({
  id: null as number | null,
  plan_code: "",
  plan_name: "",
  plan_level: 0,
  status: 1,
  remark: ""
});

const validatePlanCodeUnique = async (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value || formType.value === "edit") {
    callback();
    return;
  }
  try {
    const res = await getPlanList({ keyword: value, limit: 1, page: 1 });
    const exists = (res?.data || []).some((item: PlanView) => item.plan_code === value);
    if (exists) {
      callback(new Error("套餐编码已存在"));
      return;
    }
    callback();
  } catch (error) {
    callback(new Error("校验失败，请稍后重试"));
  }
};

const rules = reactive({
  plan_code: [
    { required: true, message: "请输入套餐编码", trigger: "blur" },
    { min: 2, max: 32, message: "长度为 2-32 位", trigger: "blur" },
    { pattern: /^[A-Za-z0-9_-]+$/, message: "仅允许字母、数字、_、-", trigger: "blur" },
    { validator: validatePlanCodeUnique, trigger: "blur" }
  ],
  plan_name: [{ required: true, message: "请输入套餐名称", trigger: "blur" }],
  plan_level: [
    { required: true, message: "请输入套餐等级", trigger: "blur" },
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        if (!Number.isInteger(value) || value < 1) {
          callback(new Error("套餐等级必须为大于等于 1 的整数"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ]
});

const getStatusLabel = (status: number) => {
  return STATUS_OPTIONS.find(item => item.value === status)?.label || "-";
};

const getStatusTag = (status: number) => {
  return STATUS_OPTIONS.find(item => item.value === status)?.tagType || "info";
};

const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getPlanList(searchParams);
    tableData.value = (res.data || []).map((item: PlanView) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取套餐列表失败");
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
  searchParams.limit = 10;
  searchParams.keyword = "";
  searchParams.status = "";
  fetchList();
};

const handleSortChange = (payload: { prop: string; order: "ascending" | "descending" | null }) => {
  if (!payload.order) {
    delete (searchParams as Record<string, unknown>).sort_by;
    delete (searchParams as Record<string, unknown>).sort_order;
  } else {
    (searchParams as Record<string, unknown>).sort_by = payload.prop;
    (searchParams as Record<string, unknown>).sort_order = payload.order === "ascending" ? "ASC" : "DESC";
  }
  fetchList();
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const openCreate = () => {
  formType.value = "create";
  drawerTitle.value = "新建套餐";
  resetForm();
  drawerRef.value.koiOpen();
};

const openEdit = (row: PlanView) => {
  formType.value = "edit";
  drawerTitle.value = "编辑套餐";
  form.id = row.id;
  form.plan_code = row.plan_code;
  form.plan_name = row.plan_name;
  form.plan_level = row.plan_level;
  form.status = row.status;
  form.remark = row.remark || "";
  drawerRef.value.koiOpen();
};

const submitForm = async () => {
  if (!formRef.value) return;
  confirmLoading.value = true;
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      koiMsgError("验证失败，请检查填写内容");
      confirmLoading.value = false;
      return;
    }
    try {
      if (formType.value === "create") {
        await createPlan({
          plan_code: form.plan_code,
          plan_name: form.plan_name,
          plan_level: form.plan_level,
          status: form.status,
          remark: form.remark || null
        });
        koiNoticeSuccess("创建成功");
      } else if (form.id) {
        await updatePlan(form.id, {
          plan_name: form.plan_name,
          plan_level: form.plan_level,
          remark: form.remark || null
        });
        koiNoticeSuccess("更新成功");
      }
      drawerRef.value.koiQuickClose();
      resetForm();
      fetchList();
    } catch (error) {
      koiNoticeError("操作失败，请稍后重试");
    } finally {
      confirmLoading.value = false;
    }
  });
};

const handleConfirm = useDebouncedSubmit(submitForm);

const handleCancel = () => {
  drawerRef.value.koiClose();
};

const resetForm = () => {
  form.id = null;
  form.plan_code = "";
  form.plan_name = "";
  form.plan_level = 0;
  form.status = 1;
  form.remark = "";
  formRef.value?.clearValidate();
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { message?: string; response?: { data?: { message?: string } } };
  return err?.response?.data?.message || err?.message || fallback;
};

const toggleStatus = (row: PlanView) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionLabel = nextStatus === 1 ? "启用" : "禁用";
  koiMsgBox(`确认${actionLabel}套餐【${row.plan_name}】？禁用不影响历史订单与已生效会员。`)
    .then(async () => {
      try {
        await updatePlanStatus(row.id, { status: nextStatus });
        koiNoticeSuccess(`${actionLabel}成功`);
        fetchList();
      } catch (error) {
        koiNoticeError(getErrorMessage(error, `${actionLabel}失败`));
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

const handleExport = () => {
  if (!tableData.value.length) {
    koiMsgError("暂无数据可导出");
    return;
  }
  const header = ["ID", "套餐编码", "套餐名称", "等级", "状态", "备注", "创建时间", "更新时间"];
  const rows = tableData.value.map(item => [
    item.id,
    item.plan_code,
    item.plan_name,
    item.plan_level,
    getStatusLabel(item.status),
    item.remark || "",
    item.createdAt,
    item.updatedAt
  ]);
  const csv = [header, ...rows].map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "plans.csv");
};

const goToPrices = (row: PlanView) => {
  router.push({ path: "/admin/membership/prices", query: { plan_id: row.id } });
};

onMounted(() => {
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


.list-toolbar-row {
  margin-bottom: 12px;
}

.list-table {
  width: 100%;
}

.list-pagination {
  margin-top: 16px;
}

.number-input {
  width: 160px;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.action-buttons :deep(.el-button) {
  margin-left: 0;
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 4px;
}
</style>
