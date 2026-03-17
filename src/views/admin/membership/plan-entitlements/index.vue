<!-- 文件用途：套餐权益配置页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />
      <div v-else class="plan-entitlements">
        <section class="plan-card">
          <div class="plan-card__header">
            <div class="plan-card__title">套餐信息</div>
            <el-tag :type="getStatusTag(planInfo?.status)">{{ getStatusLabel(planInfo?.status) }}</el-tag>
          </div>
          <div class="plan-card__grid">
            <div class="plan-card__item">
              <span class="plan-card__label">编码</span>
              <span class="plan-card__value">{{ planInfo?.plan_code || "-" }}</span>
            </div>
            <div class="plan-card__item">
              <span class="plan-card__label">名称</span>
              <span class="plan-card__value">{{ planInfo?.plan_name || "-" }}</span>
            </div>
            <div class="plan-card__item">
              <span class="plan-card__label">等级</span>
              <span class="plan-card__value">{{ planInfo?.plan_level ?? "-" }}</span>
            </div>
          </div>
        </section>

        <section class="entitlements-table">
          <div class="table-header">
            <div class="table-header__title">权益配置</div>
            <div class="table-header__actions">
              <el-button type="primary" icon="Check" plain :disabled="!hasDirty" @click="saveAll">保存</el-button>
              <el-button type="info" icon="Refresh" plain :disabled="!hasDirty" @click="restoreAll">还原全部</el-button>
              <el-button type="default" icon="RefreshRight" plain @click="fetchData">刷新</el-button>
            </div>
          </div>
          <el-table v-loading="loading" border :data="tableData" empty-text="暂无配置" class="list-table">
            <el-table-column label="权益键" prop="entitlement_key" width="160" align="center" />
            <el-table-column label="名称" prop="name" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column label="类型" prop="value_type" width="120" align="center">
              <template #default="{ row }">{{ getValueTypeLabel(row.value_type) }}</template>
            </el-table-column>
            <el-table-column label="当前值" min-width="220" align="center">
              <template #default="{ row }">
                <div class="value-editor">
                  <el-switch v-if="row.value_type === 'BOOL'" v-model="row.draftValue" @change="() => markDirty(row)" />
                  <el-input-number
                    v-else-if="isNumberType(row.value_type)"
                    v-model="row.draftValue"
                    class="number-input"
                    @change="() => markDirty(row)"
                  />
                  <el-input
                    v-else-if="row.value_type === 'STRING'"
                    v-model="row.draftValue"
                    placeholder="请输入值"
                    @input="() => markDirty(row)"
                  />
                  <el-input
                    v-else
                    v-model="row.draftValue"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入JSON"
                    @input="() => markDirty(row)"
                  />
                </div>
                <div v-if="row.error" class="value-error">{{ row.error }}</div>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" prop="updatedAt" width="180" align="center">
              <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center">
              <template #default="{ row }">
                <el-button type="primary" link :disabled="!row.isDirty" @click="saveRow(row)">保存</el-button>
                <el-button type="info" link :disabled="!row.isDirty" @click="restoreRow(row)">还原</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { STATUS_OPTIONS, VALUE_TYPE_OPTIONS } from "@/config/enums";
import { getPlanDetail } from "@/api/membership/plans";
import { getPlanEntitlements, savePlanEntitlements } from "@/api/membership/planEntitlements";
import type { PlanView } from "@/api/membership/plans/type";
import type { PlanEntitlementItem } from "@/api/membership/planEntitlements/type";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";

interface PlanEntitlementRow extends PlanEntitlementItem {
  draftValue: string | number | boolean;
  originalValue: string | number | boolean;
  isDirty: boolean;
  error?: string;
}

const route = useRoute();
const planId = computed(() => Number(route.query.plan_id || 0));
const loading = ref(false);
const planInfo = ref<PlanView | null>(null);
const tableData = ref<PlanEntitlementRow[]>([]);
const errorMessage = ref("");
const noPermission = ref(false);

const getStatusLabel = (status?: number) => {
  return STATUS_OPTIONS.find(item => item.value === status)?.label || "-";
};

const getStatusTag = (status?: number) => {
  return STATUS_OPTIONS.find(item => item.value === status)?.tagType || "info";
};

const getValueTypeLabel = (value: string) => {
  return VALUE_TYPE_OPTIONS.find(item => item.value === value)?.label || value || "-";
};

const isNumberType = (valueType: string) => {
  return valueType === "INT" || valueType === "FLOAT";
};

const normalizeDraftValue = (item: PlanEntitlementItem) => {
  if (item.value_type === "BOOL") {
    return Boolean(item.value ?? item.raw_value);
  }
  if (item.value_type === "JSON") {
    if (item.raw_value) {
      try {
        return JSON.stringify(JSON.parse(item.raw_value), null, 2);
      } catch (error) {
        return item.raw_value;
      }
    }
    if (item.value) {
      try {
        return JSON.stringify(item.value, null, 2);
      } catch (error) {
        return String(item.value);
      }
    }
    return "";
  }
  return item.raw_value ?? (item.value !== undefined && item.value !== null ? String(item.value) : "");
};

const buildRow = (item: PlanEntitlementItem): PlanEntitlementRow => {
  const draftValue = normalizeDraftValue(item);
  return {
    ...item,
    draftValue,
    originalValue: draftValue,
    isDirty: false,
    error: ""
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const hasDirty = computed(() => tableData.value.some(item => item.isDirty));

const markDirty = (row: PlanEntitlementRow) => {
  row.isDirty = row.draftValue !== row.originalValue;
};

const buildSaveValue = (row: PlanEntitlementRow) => {
  if (row.value_type === "BOOL") {
    return row.draftValue ? "true" : "false";
  }
  if (row.value_type === "JSON") {
    const parsed = JSON.parse(String(row.draftValue || "{}"));
    return JSON.stringify(parsed);
  }
  return String(row.draftValue ?? "");
};

const fetchData = async () => {
  if (!planId.value) {
    koiMsgError("缺少套餐ID");
    return;
  }
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const [planRes, entitlementRes] = await Promise.all([
      getPlanDetail(planId.value),
      getPlanEntitlements({ plan_id: planId.value })
    ]);
    planInfo.value = planRes.data || null;
    tableData.value = (entitlementRes.data || []).map((item: PlanEntitlementItem) => buildRow(item));
  } catch (error) {
    const state = resolveRequestError(error, "获取配置失败，请刷新重试");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

const saveRows = async (rows: PlanEntitlementRow[]) => {
  if (!planId.value) {
    koiMsgError("缺少套餐ID");
    throw new Error("PLAN_ID_MISSING");
  }
  const payloadItems = rows.map(row => {
    row.error = "";
    let entitlementValue = "";
    try {
      entitlementValue = buildSaveValue(row);
    } catch (error) {
      row.error = row.value_type === "JSON" ? "JSON 格式不正确" : "值格式不正确";
      throw error;
    }
    // 新创建行可能没有 updatedAt，服务端允许传空字符串作为占位
    const updatedAt = row.updatedAt || "";
    return {
      entitlement_key: row.entitlement_key,
      entitlement_value: entitlementValue,
      updatedAt
    };
  });
  // 批量保存，接口要求一次性提交所有修改项
  await savePlanEntitlements({ plan_id: planId.value, items: payloadItems });
  rows.forEach(row => {
    row.originalValue = row.draftValue;
    row.isDirty = false;
    row.error = "";
  });
};

const saveAll = async () => {
  const dirtyRows = tableData.value.filter(row => row.isDirty);
  if (!dirtyRows.length) return;
  try {
    await saveRows(dirtyRows);
    koiNoticeSuccess("保存成功");
  } catch (error: any) {
    if (dirtyRows.some(row => row.error)) {
      koiMsgError("存在格式错误，请修正后再保存");
      return;
    }
    if (error?.code === 409 || error?.message?.includes("409")) {
      koiMsgBox("数据已更新，是否刷新重试？")
        .then(fetchData)
        .catch(() => {});
      return;
    }
    if (error?.message === "VALUE_TYPE_MISMATCH") {
      koiMsgError("值格式不正确");
      return;
    }
    if (error?.message === "INVALID_JSON") {
      koiMsgError("JSON 格式不正确");
      return;
    }
    if (error?.message === "OUT_OF_RANGE") {
      koiMsgError("数值超出范围");
      return;
    }
    koiNoticeError("保存失败，请稍后重试");
  }
};

const saveRow = async (row: PlanEntitlementRow) => {
  row.error = "";
  try {
    await saveRows([row]);
    koiNoticeSuccess("保存成功");
  } catch (error: any) {
    if (error?.message === "VALUE_TYPE_MISMATCH") {
      row.error = "值格式不正确";
      return;
    }
    if (error?.message === "INVALID_JSON") {
      row.error = "JSON 格式不正确";
      return;
    }
    if (error?.message === "OUT_OF_RANGE") {
      row.error = "数值超出范围";
      return;
    }
    if (error?.code === 409 || error?.message?.includes("409")) {
      koiMsgBox("数据已更新，是否刷新重试？")
        .then(fetchData)
        .catch(() => {});
      return;
    }
    koiNoticeError("保存失败，请稍后重试");
  }
};

const restoreRow = (row: PlanEntitlementRow) => {
  row.draftValue = row.originalValue;
  row.isDirty = false;
  row.error = "";
};

const restoreAll = () => {
  tableData.value.forEach(row => {
    row.draftValue = row.originalValue;
    row.isDirty = false;
    row.error = "";
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.plan-entitlements {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 16px 18px;
  background: #fafcff;
}

.plan-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.plan-card__title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.plan-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px 24px;
}

.plan-card__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-card__label {
  font-size: 12px;
  color: #909399;
}

.plan-card__value {
  font-size: 14px;
  color: #303133;
}

.entitlements-table {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px 16px 16px;
  background: #fff;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.table-header__title {
  font-weight: 600;
  color: #303133;
}

.table-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.table-header__actions :deep(.el-button) {
  margin-left: 0;
}

.list-table {
  width: 100%;
}

.value-editor {
  display: flex;
  align-items: center;
}

.number-input {
  width: 160px;
}

.value-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
  text-align: center;
  line-height: 20px;
}
</style>
