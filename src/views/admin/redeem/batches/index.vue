<!-- 文件用途：兑换码批次页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="批次号" prop="batch_no">
          <el-input v-model="searchParams.batch_no" class="filter-input" clearable placeholder="批次号" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="批次名称" prop="name">
          <el-input v-model="searchParams.name" class="filter-input" clearable placeholder="批次名称" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item label="套餐" prop="plan_id">
          <el-select v-model="searchParams.plan_id" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in planOptions" :key="item.id" :label="item.plan_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in REDEEM_BATCH_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" prop="createdAtRange">
          <el-date-picker
            v-model="createdAtRange"
            type="daterange"
            class="filter-date"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleCreatedAtChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <el-col :span="1.5">
          <el-button type="primary" icon="Plus" plain @click="openCreate">新建批次</el-button>
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
        <el-table-column v-if="getVisible('batch_no')" column-key="batch_no" label="批次号" prop="batch_no" align="center" :min-width="getWidth('batch_no', 180)" />
        <el-table-column v-if="getVisible('name')" column-key="name" label="名称" prop="name" align="center" :min-width="getWidth('name', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('plan_name')" column-key="plan_name" label="套餐" prop="plan_name" align="center" :min-width="getWidth('plan_name', 160)" />
        <el-table-column v-if="getVisible('duration_days')" column-key="duration_days" label="时长(天)" prop="duration_days" align="center" :width="getWidth('duration_days', 120)" />
        <el-table-column v-if="getVisible('total_count')" column-key="total_count" label="总量" prop="total_count" align="center" :width="getWidth('total_count', 120)" />
        <el-table-column v-if="getVisible('effective_from')" column-key="effective_from" label="开始时间" prop="effective_from" align="center" :width="getWidth('effective_from', 180)">
          <template #default="{ row }">{{ formatDate(row.effective_from) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('effective_to')" column-key="effective_to" label="结束时间" prop="effective_to" align="center" :width="getWidth('effective_to', 180)">
          <template #default="{ row }">{{ formatDate(row.effective_to) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 120)">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('created_by')" column-key="created_by" label="创建人" prop="created_by" align="center" :width="getWidth('created_by', 160)">
          <template #default="{ row }">
            <div class="creator-cell">
              <el-avatar :size="28" :src="resolveAvatarUrl(row.created_by_user?.avatar)" class="creator-avatar">
                {{ row.created_by_user?.nickname?.slice(0, 1) || "-" }}
              </el-avatar>
              <span class="creator-name">{{ row.created_by_user?.nickname || row.created_by || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" :width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToCodes(row)">兑换码</el-button>
            <el-button type="warning" link @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
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
          <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" status-icon>
            <el-form-item label="批次号" prop="batch_no">
              <el-input v-model="form.batch_no" placeholder="可选，留空自动生成" />
            </el-form-item>
            <el-form-item label="批次名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入批次名称" />
            </el-form-item>
            <el-form-item label="套餐" prop="plan_id">
              <el-select v-model="form.plan_id" placeholder="请选择套餐">
                <el-option v-for="item in planOptions" :key="item.id" :label="item.plan_name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="时长(天)" prop="duration_days">
              <el-input-number v-model="form.duration_days" :min="1" />
            </el-form-item>
            <el-form-item label="总量" prop="total_count">
              <el-input-number v-model="form.total_count" :min="1" />
            </el-form-item>
            <el-form-item label="生效时间" prop="effectiveRange">
              <el-date-picker
                v-model="form.effectiveRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option v-for="item in REDEEM_BATCH_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
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
import { REDEEM_BATCH_STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { createBatch, getBatchList, updateBatchStatus } from "@/api/redeem/batches";
import type { BatchCreateRequest, BatchListQuery, BatchView } from "@/api/redeem/batches/type";
import { getPlanOptions } from "@/api/membership/plans";
import type { PlanOption } from "@/api/membership/plans/type";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";
import { useDebouncedSubmit } from "@/hooks/form/useDebouncedSubmit";

const router = useRouter();
const loading = ref(false);
const tableData = ref<BatchView[]>([]);
const showSearch = ref(true);
const errorMessage = ref("");
const noPermission = ref(false);
const confirmLoading = ref(false);
const drawerTitle = ref("新建批次");
const formRef = ref();
const drawerRef = ref();
const planOptions = ref<PlanOption[]>([]);
const baseUrl = import.meta.env.VITE_SERVER;

// 查询参数
const searchParams = reactive<BatchListQuery>({
  page: 1,
  limit: 10,
  batch_no: "",
  name: "",
  plan_id: "",
  status: "",
  createdAtFrom: "",
  createdAtTo: ""
});

// 分页信息
const pagination = reactive({
  totalRecords: 0
});

const createdAtRange = ref<[string, string] | []>([]);

const columns = [
  { key: "batch_no", label: "批次号", defaultWidth: 180 },
  { key: "name", label: "名称", defaultWidth: 160 },
  { key: "plan_name", label: "套餐", defaultWidth: 160 },
  { key: "duration_days", label: "时长(天)", defaultWidth: 120 },
  { key: "total_count", label: "总量", defaultWidth: 120 },
  { key: "effective_from", label: "开始时间", defaultWidth: 180 },
  { key: "effective_to", label: "结束时间", defaultWidth: 180 },
  { key: "status", label: "状态", defaultWidth: 120 },
  { key: "created_by", label: "创建人", defaultWidth: 160 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-redeem-batches",
  columns
);

// 重置列设置
const resetColumns = () => {
  reset();
};

// 表单数据
const form = reactive({
  batch_no: "",
  name: "",
  plan_id: null as number | null,
  duration_days: 30,
  total_count: 1,
  effectiveRange: [] as [string, string] | [],
  status: 1
});

// 校验规则
const rules = reactive({
  name: [{ required: true, message: "请输入批次名称", trigger: "blur" }],
  plan_id: [{ required: true, message: "请选择套餐", trigger: "change" }],
  duration_days: [{ required: true, message: "请输入时长", trigger: "blur" }],
  total_count: [{ required: true, message: "请输入数量", trigger: "blur" }],
  effectiveRange: [
    { required: true, message: "请选择生效时间", trigger: "change" },
    {
      validator: (_rule: unknown, value: [string, string] | []) => Array.isArray(value) && value.length === 2,
      message: "请选择完整的生效时间范围",
      trigger: "change"
    }
  ]
});

const resolveAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";
  return avatar.includes("http") ? avatar : `${baseUrl}${avatar}`;
};

// 获取状态显示文本
const getStatusLabel = (value: number) => {
  return REDEEM_BATCH_STATUS_OPTIONS.find(item => item.value === value)?.label || "-";
};

// 获取状态标签样式
const getStatusTag = (value: number) => {
  return REDEEM_BATCH_STATUS_OPTIONS.find(item => item.value === value)?.tagType || "info";
};

// 获取列表
const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getBatchList(searchParams);
    tableData.value = (res.data || []).map((item: BatchView) => ({
      ...item,
      createdAt: formatDate(item.createdAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取批次列表失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

// 获取套餐选项
const fetchPlanOptions = async () => {
  try {
    const res = await getPlanOptions();
    planOptions.value = res.data || [];
  } catch (error) {
    planOptions.value = [];
  }
};

// 搜索
const handleSearch = () => {
  searchParams.page = 1;
  fetchList();
};

// 重置搜索
const resetSearch = () => {
  searchParams.page = 1;
  searchParams.limit = 10;
  searchParams.batch_no = "";
  searchParams.name = "";
  searchParams.plan_id = "";
  searchParams.status = "";
  searchParams.createdAtFrom = "";
  searchParams.createdAtTo = "";
  createdAtRange.value = [];
  fetchList();
};

// 创建时间范围变化
const handleCreatedAtChange = (value: [string, string] | []) => {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.createdAtFrom = value[0];
    searchParams.createdAtTo = value[1];
  } else {
    searchParams.createdAtFrom = "";
    searchParams.createdAtTo = "";
  }
};

// 排序
const handleSortChange = (payload: { prop: string; order: "ascending" | "descending" | null }) => {
  if (!payload.order) {
    delete (searchParams as Record<string, string>).sort_by;
    delete (searchParams as Record<string, string>).sort_order;
  } else {
    (searchParams as Record<string, string>).sort_by = payload.prop;
    (searchParams as Record<string, string>).sort_order = payload.order === "ascending" ? "ASC" : "DESC";
  }
  fetchList();
};

// 打开新建
const openCreate = () => {
  drawerTitle.value = "新建批次";
  resetForm();
  drawerRef.value.koiOpen();
};

// 提交表单
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
      const payload: BatchCreateRequest = {
        batch_no: form.batch_no || null,
        name: form.name,
        plan_id: form.plan_id as number,
        duration_days: form.duration_days,
        total_count: form.total_count,
        effective_from: Array.isArray(form.effectiveRange) ? form.effectiveRange[0] : null,
        effective_to: Array.isArray(form.effectiveRange) ? form.effectiveRange[1] : null,
        status: form.status
      };
      await createBatch(payload);
      koiNoticeSuccess("创建成功");
      drawerRef.value.koiQuickClose();
      resetForm();
      fetchList();
    } catch (error) {
      const state = resolveRequestError(error, "创建失败");
      koiNoticeError(state.message);
    } finally {
      confirmLoading.value = false;
    }
  });
};

const handleConfirm = useDebouncedSubmit(submitForm);

// 关闭表单
const handleCancel = () => {
  drawerRef.value.koiClose();
};

// 重置表单
const resetForm = () => {
  form.batch_no = "";
  form.name = "";
  form.plan_id = null;
  form.duration_days = 30;
  form.total_count = 1;
  form.effectiveRange = [];
  form.status = 1;
  formRef.value?.clearValidate();
};

// 切换状态
const toggleStatus = (row: BatchView) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionLabel = nextStatus === 1 ? "启用" : "禁用";
  koiMsgBox(`确认${actionLabel}批次【${row.batch_no}】？`)
    .then(async () => {
      try {
        await updateBatchStatus(row.id, { status: nextStatus });
        koiNoticeSuccess(`${actionLabel}成功`);
        fetchList();
      } catch (error) {
        const state = resolveRequestError(error, `${actionLabel}失败`);
        koiNoticeError(state.message);
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

// 跳转兑换码列表
const goToCodes = (row: BatchView) => {
  router.push({ path: "/admin/redeem/codes", query: { batch_no: row.batch_no } });
};

// 格式化时间
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

// 导出
const handleExport = () => {
  if (!tableData.value.length) {
    koiMsgError("暂无数据可导出");
    return;
  }
  const header = ["批次号", "名称", "套餐", "时长(天)", "总量", "开始时间", "结束时间", "状态", "创建人", "创建时间"];
  const rows = tableData.value.map(item => [
    item.batch_no,
    item.name,
    item.plan_name || item.plan_id,
    item.duration_days,
    item.total_count,
    formatDate(item.effective_from),
    formatDate(item.effective_to),
    getStatusLabel(item.status),
    item.created_by || "",
    item.createdAt || "-"
  ]);
  const csv = [header, ...rows]
    .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "batches.csv");
};

onMounted(() => {
  fetchPlanOptions();
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

.filter-date {
  width: 240px;
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

.creator-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.creator-avatar {
  background: #f2f3f5;
  color: #909399;
  font-size: 12px;
}

.creator-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 12px;
}
</style>
