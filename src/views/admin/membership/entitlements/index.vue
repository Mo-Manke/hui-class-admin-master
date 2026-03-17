<!-- 权益定义列表页 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true" class="filter-form">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="searchParams.keyword"
            class="filter-input"
            clearable
            placeholder="权益键/名称"
            @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型" prop="value_type">
          <el-select v-model="searchParams.value_type" class="filter-select" clearable placeholder="全部">
            <el-option v-for="item in VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="Refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="list-toolbar-row">
        <el-col :span="1.5">
          <el-button type="primary" icon="Plus" plain @click="openCreate">新建权益</el-button>
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
        <el-table-column v-if="getVisible('entitlement_key')" column-key="entitlement_key" label="权益键" prop="entitlement_key" align="center" :width="getWidth('entitlement_key', 160)" />
        <el-table-column v-if="getVisible('icon')" column-key="icon" label="图标" prop="icon" align="center" :width="getWidth('icon', 120)">
          <template #default="{ row }">
            <el-image
              v-if="row.icon"
              class="entitlement-icon"
              :preview-teleported="true"
              :preview-src-list="[formatIconUrl(row.icon)]"
              :src="formatIconUrl(row.icon)"
            >
              <template #error>
                <el-icon class="entitlement-icon__error" :size="20">
                  <CircleCloseFilled />
                </el-icon>
              </template>
            </el-image>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('name')" column-key="name" label="名称" prop="name" align="center" :min-width="getWidth('name', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('sub_title')" column-key="sub_title" label="副标题" prop="sub_title" align="center" :min-width="getWidth('sub_title', 160)" show-overflow-tooltip />
        <el-table-column
          v-if="getVisible('non_member_display_text')"
          column-key="non_member_display_text"
          label="非会员展示"
          prop="non_member_display_text"
          align="center"
          :min-width="getWidth('non_member_display_text', 160)"
          show-overflow-tooltip
        />
        <el-table-column v-if="getVisible('is_new')" column-key="is_new" label="新功能" prop="is_new" align="center" :width="getWidth('is_new', 100)">
          <template #default="{ row }">
            <el-tag :type="row.is_new ? 'success' : 'info'">{{ row.is_new ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="getVisible('value_type')" column-key="value_type" label="类型" prop="value_type" align="center" :width="getWidth('value_type', 120)">
          <template #default="{ row }">{{ getValueTypeLabel(row.value_type) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('sort')" column-key="sort" label="排序" prop="sort" align="center" :width="getWidth('sort', 100)" sortable="custom" />
        <el-table-column v-if="getVisible('remark')" column-key="remark" label="备注" prop="remark" align="center" :min-width="getWidth('remark', 160)" show-overflow-tooltip />
        <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column v-if="getVisible('updatedAt')" column-key="updatedAt" label="更新时间" prop="updatedAt" align="center" :width="getWidth('updatedAt', 180)" sortable="custom">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" :width="160">
          <template #default="{ row }">
            <el-tooltip content="编辑" placement="top">
              <el-button type="primary" icon="Edit" circle plain @click="openEdit(row)" />
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
          <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" status-icon>
            <el-form-item label="权益键" prop="entitlement_key">
              <el-input v-model="form.entitlement_key" :disabled="formType === 'edit'" placeholder="如 download_limit" />
            </el-form-item>
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" placeholder="如 下载次数" />
            </el-form-item>
            <el-form-item label="副标题" prop="sub_title">
              <el-input v-model="form.sub_title" placeholder="如 会员无限下载" />
            </el-form-item>
            <el-form-item label="非会员展示" prop="non_member_display_text">
              <el-input v-model="form.non_member_display_text" placeholder="如 不支持" />
            </el-form-item>
            <el-form-item label="新功能" prop="is_new">
              <el-switch v-model="form.is_new" />
            </el-form-item>
            <el-form-item label="类型" prop="value_type">
              <el-select v-model="form.value_type" placeholder="请选择类型">
                <el-option v-for="item in VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="isValueTypeChanged" label="权益默认值" prop="new_default_value">
              <el-switch v-if="form.value_type === 'BOOL'" v-model="form.new_default_value" />
              <el-input-number
                v-else-if="form.value_type === 'INT'"
                v-model="form.new_default_value"
                :precision="0"
                :controls="false"
                class="number-input"
                placeholder="请输入默认值"
              />
              <el-input-number
                v-else-if="form.value_type === 'FLOAT'"
                v-model="form.new_default_value"
                :precision="2"
                :controls="false"
                class="number-input"
                placeholder="请输入默认值"
              />
              <el-input
                v-else-if="form.value_type === 'JSON'"
                v-model="form.new_default_value"
                type="textarea"
                :rows="4"
                placeholder="请输入 JSON"
              />
              <el-input v-else v-model="form.new_default_value" placeholder="请输入默认值" />
            </el-form-item>
            <el-form-item label="图标" prop="icon">
              <KoiUploadImage v-model:imageUrl="form.icon" action="/api/admin/upload">
                <template #content>
                  <el-icon><Picture /></el-icon>
                  <span>请上传图标</span>
                </template>
                <template #tip>图片最大为 3M</template>
              </KoiUploadImage>
            </el-form-item>
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :controls="false" class="number-input" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选备注" />
            </el-form-item>
          </el-form>
        </template>
      </KoiDrawer>

      <el-dialog v-model="typeChangeResultVisible" title="类型修改结果" width="360px">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="更新套餐">{{ typeChangeResult.updatedPlans }}</el-descriptions-item>
          <el-descriptions-item label="更新权益值">{{ typeChangeResult.updatedRows }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button type="primary" @click="typeChangeResultVisible = false">确定</el-button>
        </template>
      </el-dialog>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import ListToolbar from "@/components/Common/ListToolbar.vue";
import { VALUE_TYPE_OPTIONS } from "@/config/enums";
import { normalizePagination } from "@/api/common/pagination";
import { changeEntitlementValueType, createEntitlement, getEntitlementList, updateEntitlement } from "@/api/membership/entitlements";
import type { EntitlementChangeValueTypeResult, EntitlementView } from "@/api/membership/entitlements/type";
import { CircleCloseFilled, Picture } from "@element-plus/icons-vue";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { useDebouncedSubmit } from "@/hooks/form/useDebouncedSubmit";
import { useTableColumnSettings } from "@/hooks/table/useTableColumnSettings";
import { downloadBlob } from "@/utils/download";
import { resolveRequestError } from "@/utils/requestState";

const loading = ref(false);
const tableData = ref<EntitlementView[]>([]);
const showSearch = ref(true);
const confirmLoading = ref(false);
const drawerTitle = ref("新建权益");
const formType = ref<"create" | "edit">("create");
const errorMessage = ref("");
const noPermission = ref(false);
const formRef = ref();
const drawerRef = ref();
const baseUrl = import.meta.env.VITE_SERVER;
const originalValueType = ref("");
const confirmedValueType = ref("");
const isTypeConfirming = ref(false);
const skipTypeConfirm = ref(false);
const typeChangeResultVisible = ref(false);
const typeChangeResult = reactive<EntitlementChangeValueTypeResult>({
  updatedPlans: 0,
  updatedRows: 0
});

const searchParams = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  value_type: ""
});

const pagination = reactive({
  totalRecords: 0
});

const columns = [
  { key: "id", label: "ID", defaultWidth: 80 },
  { key: "entitlement_key", label: "权益键", defaultWidth: 160 },
  { key: "icon", label: "图标", defaultWidth: 140 },
  { key: "name", label: "名称", defaultWidth: 160 },
  { key: "sub_title", label: "副标题", defaultWidth: 180 },
  { key: "non_member_display_text", label: "非会员展示", defaultWidth: 180 },
  { key: "is_new", label: "新功能", defaultWidth: 100 },
  { key: "value_type", label: "类型", defaultWidth: 120 },
  { key: "sort", label: "排序", defaultWidth: 100 },
  { key: "remark", label: "备注", defaultWidth: 160 },
  { key: "createdAt", label: "创建时间", defaultWidth: 180 },
  { key: "updatedAt", label: "更新时间", defaultWidth: 180 }
];

const { columnState, setVisible, getVisible, getWidth, handleHeaderDragend, reset } = useTableColumnSettings(
  "admin-membership-entitlements",
  columns
);

const resetColumns = () => {
  reset();
};

const form = reactive({
  id: null as number | null,
  entitlement_key: "",
  name: "",
  sub_title: "",
  non_member_display_text: "",
  is_new: false,
  value_type: "",
  icon: "",
  sort: 0,
  remark: "",
  updatedAt: "",
  new_default_value: null as string | number | boolean | null
});

const isValueTypeChanged = computed(() => {
  if (formType.value !== "edit") return false;
  if (!originalValueType.value) return false;
  if (!confirmedValueType.value) return false;
  if (form.value_type !== confirmedValueType.value) return false;
  return confirmedValueType.value !== originalValueType.value;
});

const validateKeyUnique = async (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value || formType.value === "edit") {
    callback();
    return;
  }
  try {
    const res = await getEntitlementList({ keyword: value, limit: 1, page: 1 });
    const exists = (res?.data || []).some((item: EntitlementView) => item.entitlement_key === value);
    if (exists) {
      callback(new Error("权益键已存在"));
      return;
    }
    callback();
  } catch (error) {
    callback(new Error("校验失败，请稍后重试"));
  }
};

const resetDefaultValue = () => {
  if (form.value_type === "BOOL") {
    form.new_default_value = false;
    return;
  }
  if (form.value_type === "INT" || form.value_type === "FLOAT") {
    form.new_default_value = null;
    return;
  }
  form.new_default_value = "";
};

const buildDefaultValue = () => {
  if (form.value_type === "BOOL") {
    return form.new_default_value ? "true" : "false";
  }
  if (form.value_type === "INT" || form.value_type === "FLOAT") {
    if (form.new_default_value === null || form.new_default_value === "") return "";
    return String(form.new_default_value);
  }
  if (form.value_type === "JSON") {
    return String(form.new_default_value || "").trim();
  }
  return String(form.new_default_value || "").trim();
};

const validateDefaultValue = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  if (!isValueTypeChanged.value) {
    callback();
    return;
  }
  if (form.value_type === "BOOL") {
    callback();
    return;
  }
  if (form.value_type === "INT" || form.value_type === "FLOAT") {
    const num = Number(form.new_default_value);
    if (form.new_default_value === null || form.new_default_value === "" || Number.isNaN(num)) {
      callback(new Error("请输入数字默认值"));
      return;
    }
    callback();
    return;
  }
  if (form.value_type === "JSON") {
    const text = String(form.new_default_value || "").trim();
    if (!text) {
      callback(new Error("请输入 JSON 默认值"));
      return;
    }
    try {
      JSON.parse(text);
      callback();
    } catch {
      callback(new Error("JSON 格式错误"));
    }
    return;
  }
  const text = String(form.new_default_value || "").trim();
  if (!text) {
    callback(new Error("请输入默认值"));
    return;
  }
  callback();
};

const rules = reactive({
  entitlement_key: [
    { required: true, message: "请输入权益键", trigger: "blur" },
    { min: 2, max: 64, message: "长度为 2-64 位", trigger: "blur" },
    { pattern: /^[A-Za-z0-9_.-]+$/, message: "仅允许字母、数字、._-", trigger: "blur" },
    { validator: validateKeyUnique, trigger: "blur" }
  ],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  sub_title: [{ required: true, message: "请输入副标题", trigger: "blur" }],
  value_type: [{ required: true, message: "请选择类型", trigger: "change" }],
  new_default_value: [{ validator: validateDefaultValue, trigger: "change" }]
});

const getValueTypeLabel = (value: string) => {
  return VALUE_TYPE_OPTIONS.find(item => item.value === value)?.label || value || "-";
};

const formatIconUrl = (icon?: string | null) => {
  if (!icon) return "";
  return icon.includes("http") ? icon : `${baseUrl}${icon}`;
};

const fetchList = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getEntitlementList(searchParams);
    tableData.value = res.data || [];
    const pageInfo = normalizePagination(res);
    pagination.totalRecords = pageInfo.totalRecords ?? 0;
  } catch (error) {
    const state = resolveRequestError(error, "获取权益列表失败");
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
  searchParams.value_type = "";
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
  drawerTitle.value = "新建权益";
  resetForm();
  drawerRef.value.koiOpen();
};

const openEdit = (row: EntitlementView) => {
  formType.value = "edit";
  drawerTitle.value = "编辑权益";
  form.id = row.id;
  form.entitlement_key = row.entitlement_key;
  form.name = row.name;
  form.sub_title = row.sub_title || "";
  form.non_member_display_text = row.non_member_display_text || "";
  form.is_new = !!row.is_new;
  skipTypeConfirm.value = true;
  form.value_type = row.value_type;
  skipTypeConfirm.value = false;
  originalValueType.value = row.value_type;
  confirmedValueType.value = row.value_type;
  form.icon = row.icon || "";
  form.sort = row.sort ?? 0;
  form.remark = row.remark || "";
  form.updatedAt = row.updatedAt || "";
  resetDefaultValue();
  drawerRef.value.koiOpen();
};

watch(
  () => form.value_type,
  async (value, prev) => {
    if (formType.value !== "edit") return;
    if (skipTypeConfirm.value) return;
    if (!value || value === confirmedValueType.value) return;
    if (value === originalValueType.value) {
      confirmedValueType.value = value;
      resetDefaultValue();
      return;
    }
    if (isTypeConfirming.value) return;
    isTypeConfirming.value = true;
    try {
      await koiMsgBox("修改类型将导致所有套餐中原权益数值丢失，确认要这么做吗？");
      confirmedValueType.value = value;
      resetDefaultValue();
    } catch {
      skipTypeConfirm.value = true;
      form.value_type = confirmedValueType.value || prev || originalValueType.value;
      skipTypeConfirm.value = false;
    } finally {
      isTypeConfirming.value = false;
    }
  }
);

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
        await createEntitlement({
          entitlement_key: form.entitlement_key,
          name: form.name,
          sub_title: form.sub_title,
          non_member_display_text: form.non_member_display_text || null,
          is_new: form.is_new ?? false,
          value_type: form.value_type,
          icon: form.icon || null,
          sort: form.sort ?? 0,
          remark: form.remark || null
        });
        koiNoticeSuccess("创建成功");
      } else if (form.id) {
        const updateRes = await updateEntitlement(form.id, {
          name: form.name,
          sub_title: form.sub_title,
          non_member_display_text: form.non_member_display_text || null,
          is_new: form.is_new ?? false,
          icon: form.icon || null,
          sort: form.sort ?? 0,
          remark: form.remark || null,
          updatedAt: form.updatedAt || null
        });
        const nextUpdatedAt = updateRes?.data?.updatedAt || form.updatedAt || null;
        form.updatedAt = nextUpdatedAt || "";
        if (isValueTypeChanged.value) {
          const changeRes = await changeEntitlementValueType(form.id, {
            value_type: form.value_type,
            new_default_value: buildDefaultValue(),
            updatedAt: nextUpdatedAt
          });
          typeChangeResult.updatedPlans = changeRes?.data?.updatedPlans ?? 0;
          typeChangeResult.updatedRows = changeRes?.data?.updatedRows ?? 0;
          typeChangeResultVisible.value = true;
        }
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
  form.entitlement_key = "";
  form.name = "";
  form.sub_title = "";
  form.non_member_display_text = "";
  form.is_new = false;
  form.value_type = "";
  form.icon = "";
  form.sort = 0;
  form.remark = "";
  form.updatedAt = "";
  form.new_default_value = null;
  originalValueType.value = "";
  confirmedValueType.value = "";
  formRef.value?.clearValidate();
};

const handleExport = () => {
  if (!tableData.value.length) {
    koiMsgError("暂无数据可导出");
    return;
  }
  const header = ["ID", "权益键", "图标", "名称", "副标题", "非会员展示", "新功能", "类型", "排序", "备注", "创建时间", "更新时间"];
  const rows = tableData.value.map(item => [
    item.id,
    item.entitlement_key,
    item.icon || "",
    item.name,
    item.sub_title || "",
    item.non_member_display_text || "",
    item.is_new ? "是" : "否",
    getValueTypeLabel(item.value_type),
    item.sort ?? 0,
    item.remark || "",
    formatDate(item.createdAt),
    formatDate(item.updatedAt)
  ]);
  const csv = [header, ...rows].map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "entitlements.csv");
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

.entitlement-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.entitlement-icon__error {
  color: var(--el-color-primary);
}

:deep(.el-button.el-button--default.is-circle.el-tooltip__trigger) {
  margin-left: 4px;
}
</style>
