<!-- 会员价格列表页 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="套餐" prop="plan_id">
          <el-select v-model="searchParams.plan_id" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in planOptions" :key="item.id" :label="item.plan_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道" prop="channel">
          <el-select v-model="searchParams.channel" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchParams.status" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长(天)" prop="duration_days">
          <el-input-number v-model="searchParams.duration_days" class="number-input" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="searchParams.keyword" class="filter-input" clearable placeholder="展示名称/备注" @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <el-col :span="1.5">
          <el-button type="primary" icon="Plus" plain @click="openCreate">新建价格</el-button>
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
        <el-table-column v-if="getVisible('id')" column-key="id" label="ID" prop="id" align="center" :width="getWidth('id', 80)" sortable="custom" />
        <el-table-column v-if="getVisible('price_name')" column-key="price_name" label="价格名称" align="center" :min-width="getWidth('price_name', 180)">
          <template #default="{ row }">
            <div v-if="row.display?.display_name" class="richtext-content" v-html="row.display.display_name"></div>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('plan_id')" column-key="plan_id" label="套餐" prop="plan_id" align="center" :min-width="getWidth('plan_id', 160)">
          <template #default="{ row }">{{ getPlanName(row.plan_id) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('duration_days')" column-key="duration_days" label="时长(天)" prop="duration_days" align="center" :width="getWidth('duration_days', 110)" sortable="custom" />
        <el-table-column v-if="getVisible('currency')" column-key="currency" label="币种" prop="currency" align="center" :width="getWidth('currency', 90)" />
        <el-table-column v-if="getVisible('channel')" column-key="channel" label="渠道" prop="channel" align="center" :width="getWidth('channel', 110)" />
        <el-table-column v-if="getVisible('list_price_cent')" column-key="list_price_cent" label="原价(元)" prop="list_price_cent" align="center" :width="getWidth('list_price_cent', 110)">
          <template #default="{ row }">{{ formatPrice(row.list_price_cent) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('sale_price_cent')" column-key="sale_price_cent" label="折扣价(元)" prop="sale_price_cent" align="center" :width="getWidth('sale_price_cent', 110)">
          <template #default="{ row }">{{ formatPrice(row.sale_price_cent) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('status')" column-key="status" label="状态" prop="status" align="center" :width="getWidth('status', 90)">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('display')" column-key="display" label="展示文案" align="center" :min-width="getWidth('display', 180)">
          <template #default="{ row }">
            <div v-if="row.display" class="display-text">
              <div>
                <div v-if="row.display.bottom_text" class="richtext-content" v-html="row.display.bottom_text"></div>
                <span v-else>-</span>
              </div>
              <div class="display-text__sub">
                <div v-if="row.display.sub_text" class="richtext-content" v-html="row.display.sub_text"></div>
                <span v-else>-</span>
              </div>
            </div>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('badges')" column-key="badges" label="角标" align="center" :min-width="getWidth('badges', 180)">
          <template #default="{ row }">
            <div v-if="row.badges && row.badges.length" class="badge-list">
              <el-tag v-for="item in sortBadges(row.badges)" :key="item.id" size="small" class="badge-list__item">
                <span v-if="item.badge_text" class="richtext-content" v-html="item.badge_text"></span>
                <span v-else>-</span>
              </el-tag>
            </div>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('remark')" column-key="remark" label="备注" prop="remark" align="center" :min-width="getWidth('remark', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)" sortable="custom" />
        <el-table-column label="操作" align="center" fixed="right" :width="220">
          <template #default="{ row }">
            <el-tooltip content="详情" placement="top">
              <el-button type="primary" icon="View" circle plain @click="goToDetail(row)" />
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button type="primary" icon="Edit" circle plain @click="openEdit(row)" />
            </el-tooltip>
            <el-tooltip content="启用/禁用" placement="top">
              <el-button type="warning" icon="Switch" circle plain @click="toggleStatus(row)" />
            </el-tooltip>
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
            <el-form-item label="套餐" prop="plan_id">
              <el-select v-model="form.plan_id" placeholder="请选择套餐">
                <el-option v-for="item in planOptions" :key="item.id" :label="item.plan_name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="时长(天)" prop="duration_days">
              <el-input-number v-model="form.duration_days" :min="1" class="number-input" />
            </el-form-item>
            <el-form-item label="币种" prop="currency">
              <el-select v-model="form.currency" placeholder="请选择币种">
                <el-option v-for="item in CURRENCY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="渠道" prop="channel">
              <el-select v-model="form.channel" placeholder="请选择渠道">
                <el-option v-for="item in CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="原价(元)" prop="list_price_cent">
              <el-input-number v-model="form.list_price_cent" :min="0" :step="0.01" :precision="2" class="number-input" />
            </el-form-item>
            <el-form-item label="折扣价(元)" prop="sale_price_cent">
              <el-input-number v-model="form.sale_price_cent" :min="0" :step="0.01" :precision="2" class="number-input" />
            </el-form-item>
            <el-form-item v-if="formType === 'create'" label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
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
import { CHANNEL_OPTIONS, CURRENCY_OPTIONS, STATUS_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { createPrice, getPriceList, updatePrice, updatePriceStatus } from "@/api/membership/prices";
import type { PriceView } from "@/api/membership/prices/type";
import { getPlanOptions } from "@/api/membership/plans";
import type { PlanOption } from "@/api/membership/plans/type";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useDebouncedSubmit } from "@/hooks/form/useDebouncedSubmit";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";

const loading = ref(false);
const tableData = ref<PriceView[]>([]);
const showSearch = ref(true);
const confirmLoading = ref(false);
const drawerTitle = ref("新建价格");
const formType = ref<"create" | "edit">("create");
const errorMessage = ref("");
const noPermission = ref(false);
const formRef = ref();
const drawerRef = ref();
const planOptions = ref<PlanOption[]>([]);
const router = useRouter();

const searchParams = reactive({
  page: 1,
  limit: 10,
  plan_id: "",
  channel: "",
  status: "",
  duration_days: undefined as number | undefined,
  keyword: ""
});

const pagination = reactive({
  totalRecords: 0
});

const columns = [
  { key: "id", label: "ID", defaultWidth: 80 },
  { key: "price_name", label: "价格名称", defaultWidth: 180 },
  { key: "plan_id", label: "套餐", defaultWidth: 160 },
  { key: "duration_days", label: "时长(天)", defaultWidth: 110 },
  { key: "currency", label: "币种", defaultWidth: 90 },
  { key: "channel", label: "渠道", defaultWidth: 110 },
  { key: "list_price_cent", label: "原价(元)", defaultWidth: 110 },
  { key: "sale_price_cent", label: "折扣价(元)", defaultWidth: 110 },
  { key: "status", label: "状态", defaultWidth: 90 },
  { key: "display", label: "展示文案", defaultWidth: 180 },
  { key: "badges", label: "角标", defaultWidth: 180 },
  { key: "remark", label: "备注", defaultWidth: 160 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-membership-prices",
  columns
);

const resetColumns = () => {
  reset();
};

const form = reactive({
  id: null as number | null,
  plan_id: null as number | null,
  duration_days: 30,
  currency: "CNY",
  channel: "WEB",
  list_price_cent: 0,
  sale_price_cent: 0,
  status: 1,
  remark: "",
  updatedAt: ""
});

const rules = reactive({
  plan_id: [{ required: true, message: "请选择套餐", trigger: "change" }],
  duration_days: [{ required: true, message: "请输入时长", trigger: "blur" }],
  currency: [{ required: true, message: "请选择币种", trigger: "change" }],
  channel: [{ required: true, message: "请选择渠道", trigger: "change" }],
  list_price_cent: [{ required: true, message: "请输入原价", trigger: "blur" }],
  sale_price_cent: [
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        if (value > form.list_price_cent) {
          callback(new Error("折扣价不能大于原价"));
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

const getPlanName = (planId: number) => {
  return planOptions.value.find(item => item.id === planId)?.plan_name || planId;
};

const sortBadges = (badges: PriceView["badges"]) => {
  if (!badges) return [];
  return [...badges].sort((a, b) => a.sort - b.sort);
};

const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getPriceList(searchParams);
    tableData.value = (res.data || []).map((item: PriceView) => ({
      ...item,
      createdAt: formatDate(item.createdAt)
    }));
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取价格列表失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    const res = await getPlanOptions();
    planOptions.value = res.data || [];
  } catch (error) {
    planOptions.value = [];
  }
};

const handleSearch = () => {
  searchParams.page = 1;
  fetchList();
};

const resetSearch = () => {
  searchParams.page = 1;
  searchParams.limit = 10;
  searchParams.plan_id = "";
  searchParams.channel = "";
  searchParams.status = "";
  searchParams.duration_days = undefined;
  searchParams.keyword = "";
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

const goToDetail = (row: PriceView) => {
  router.push({ path: `/admin/membership/prices/${row.id}` });
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return (amount / 100).toFixed(2);
};

const openCreate = () => {
  formType.value = "create";
  drawerTitle.value = "新建价格";
  resetForm();
  drawerRef.value.koiOpen();
};

const openEdit = (row: PriceView) => {
  formType.value = "edit";
  drawerTitle.value = "编辑价格";
  form.id = row.id;
  form.plan_id = row.plan_id;
  form.duration_days = row.duration_days;
  form.currency = row.currency;
  form.channel = row.channel;
  form.list_price_cent = row.list_price_cent / 100;
  form.sale_price_cent = (row.sale_price_cent || 0) / 100;
  form.status = row.status;
  form.remark = row.remark || "";
  form.updatedAt = row.updatedAt || "";
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
      const payload = {
        plan_id: form.plan_id as number,
        duration_days: form.duration_days,
        currency: form.currency,
        channel: form.channel,
        list_price_cent: Math.round(form.list_price_cent * 100),
        sale_price_cent: Math.round(form.sale_price_cent * 100),
        remark: form.remark || null,
        updatedAt: form.updatedAt || null
      };
      if (formType.value === "create") {
        await createPrice({ ...payload, status: form.status });
        koiNoticeSuccess("创建成功");
      } else if (form.id) {
        await updatePrice(form.id, payload);
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
  form.plan_id = null;
  form.duration_days = 30;
  form.currency = "CNY";
  form.channel = "WEB";
  form.list_price_cent = 0;
  form.sale_price_cent = 0;
  form.status = 1;
  form.remark = "";
  form.updatedAt = "";
  formRef.value?.clearValidate();
};

const toggleStatus = (row: PriceView) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionLabel = nextStatus === 1 ? "启用" : "禁用";
  koiMsgBox(`确认${actionLabel}价格？同套餐同渠道同时长仅允许一个启用。`)
    .then(async () => {
      await updatePriceStatus(row.id, { status: nextStatus });
      koiNoticeSuccess(`${actionLabel}成功`);
      fetchList();
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
  const header = ["ID", "套餐", "时长(天)", "币种", "渠道", "原价(元)", "折扣价(元)", "状态", "备注", "创建时间"];
  const rows = tableData.value.map(item => [
    item.id,
    getPlanName(item.plan_id),
    item.duration_days,
    item.currency,
    item.channel,
    formatPrice(item.list_price_cent),
    formatPrice(item.sale_price_cent),
    getStatusLabel(item.status),
    item.remark || "",
    item.createdAt
  ]);
  const csv = [header, ...rows].map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "prices.csv");
};

onMounted(() => {
  fetchOptions();
  fetchList();
});
</script>

<style lang="scss" scoped>
.filter-form {
  margin-bottom: 12px;
}

.filter-select {
  width: 160px;
}

.filter-input {
  width: 180px;
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

.display-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.display-text__sub {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.badge-list__item {
  margin: 0;
}

.richtext-content {
  line-height: 1.5;
  word-break: break-word;
}


:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 4px;
}
</style>
