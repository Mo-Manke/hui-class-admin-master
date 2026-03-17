<!-- 会员价格详情页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <div class="detail-toolbar">
        <el-button icon="ArrowLeft" plain @click="handleBack">返回</el-button>
      </div>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <div v-else v-loading="loading" class="detail-content">
        <el-descriptions title="价格信息" :column="3" border>
          <el-descriptions-item label="ID">{{ priceDetail?.id }}</el-descriptions-item>
          <el-descriptions-item label="套餐">{{ getPlanName(priceDetail?.plan_id) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(priceDetail?.status)">{{ getStatusLabel(priceDetail?.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时长(天)">{{ priceDetail?.duration_days }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ priceDetail?.channel }}</el-descriptions-item>
          <el-descriptions-item label="币种">{{ priceDetail?.currency }}</el-descriptions-item>
          <el-descriptions-item label="原价(元)">{{ formatPrice(priceDetail?.list_price_cent) }}</el-descriptions-item>
          <el-descriptions-item label="折扣价(元)">{{ formatPrice(priceDetail?.sale_price_cent) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ priceDetail?.remark || "-" }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(priceDetail?.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(priceDetail?.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-card">
          <div class="section-card__header">
            <div class="section-card__title">展示配置</div>
            <div class="section-card__actions">
              <el-button v-if="!priceDetail?.display" type="primary" plain @click="openDisplayCreate">新增配置</el-button>
              <template v-else>
                <el-button type="primary" plain @click="openDisplayEdit">编辑</el-button>
                <el-button type="danger" plain @click="handleDisplayDelete">删除</el-button>
              </template>
            </div>
          </div>
          <div v-if="!priceDetail?.display" class="section-empty">未配置</div>
          <el-descriptions v-else :column="2" border>
            <el-descriptions-item label="展示名称">
              <div v-if="priceDetail?.display?.display_name" class="richtext-content" v-html="priceDetail?.display?.display_name"></div>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="底部文案">
              <div v-if="priceDetail?.display?.bottom_text" class="richtext-content" v-html="priceDetail?.display?.bottom_text"></div>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="副文案">
              <div v-if="priceDetail?.display?.sub_text" class="richtext-content" v-html="priceDetail?.display?.sub_text"></div>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTag(priceDetail?.display?.status)">{{ getStatusLabel(priceDetail?.display?.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="时间窗">
              {{ formatDateRange(priceDetail?.display?.startAt, priceDetail?.display?.endAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(priceDetail?.display?.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(priceDetail?.display?.updatedAt) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="section-card">
          <div class="section-card__header">
            <div class="section-card__title">标签列表</div>
            <div class="section-card__actions">
              <el-button type="primary" plain @click="openBadgeCreate">新增标签</el-button>
            </div>
          </div>
          <el-table :data="sortedBadges" border empty-text="暂无标签" class="badge-table">
            <el-table-column label="文案" prop="badge_text" align="center" min-width="160">
              <template #default="{ row }">
                <div v-if="row.badge_text" class="richtext-content" v-html="row.badge_text"></div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" prop="badge_type" align="center" width="120" />
            <el-table-column label="位置" prop="position" align="center" width="140" />
            <el-table-column label="排序" prop="sort" align="center" width="80" />
            <el-table-column label="状态" prop="status" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间窗" align="center" min-width="200">
              <template #default="{ row }">
                {{ formatDateRange(row.startAt, row.endAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="160">
              <template #default="{ row }">
                <el-button type="primary" link @click="openBadgeEdit(row)">编辑</el-button>
                <el-button type="danger" link @click="handleBadgeDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </KoiCard>

    <el-dialog
      v-model="displayDialogVisible"
      :title="displayDialogTitle"
      width="720px"
      :append-to-body="false"
      class="price-display-dialog"
      @close="resetDisplayForm"
    >
      <el-form ref="displayFormRef" :model="displayForm" :rules="displayRules" label-width="96px" status-icon>
        <el-form-item label="输入方式">
          <el-radio-group v-model="displayEditorMode">
            <el-radio-button label="rich">可视化</el-radio-button>
            <el-radio-button label="html">HTML</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="展示名称" prop="display_name">
          <div v-if="displayEditorMode === 'rich'" class="richtext-editor-only">
            <QuillEditor v-model:content="displayForm.display_name" content-type="html" theme="snow" :options="quillOptions" />
          </div>
          <el-input v-else v-model="displayForm.display_name" type="textarea" :rows="6" placeholder="请输入 HTML 代码" />
        </el-form-item>
        <el-form-item label="底部文案" prop="bottom_text">
          <div v-if="displayEditorMode === 'rich'" class="richtext-editor-only">
            <QuillEditor v-model:content="displayForm.bottom_text" content-type="html" theme="snow" :options="quillOptions" />
          </div>
          <el-input v-else v-model="displayForm.bottom_text" type="textarea" :rows="6" placeholder="请输入 HTML 代码" />
        </el-form-item>
        <el-form-item label="副文案" prop="sub_text">
          <div v-if="displayEditorMode === 'rich'" class="richtext-editor-only">
            <QuillEditor v-model:content="displayForm.sub_text" content-type="html" theme="snow" :options="quillOptions" />
          </div>
          <el-input v-else v-model="displayForm.sub_text" type="textarea" :rows="6" placeholder="请输入 HTML 代码" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="displayForm.status" placeholder="请选择状态">
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startAt">
          <el-date-picker v-model="displayForm.startAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可空" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endAt">
          <el-date-picker v-model="displayForm.endAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="displayDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="displaySubmitting" @click="handleDisplaySubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="badgeDialogVisible" :title="badgeDialogTitle" width="560px" @close="resetBadgeForm">
      <el-form ref="badgeFormRef" :model="badgeForm" :rules="badgeRules" label-width="96px" status-icon>
        <el-form-item label="输入方式">
          <el-radio-group v-model="badgeEditorMode">
            <el-radio-button label="rich">可视化</el-radio-button>
            <el-radio-button label="html">HTML</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文案" prop="badge_text">
          <div v-if="badgeEditorMode === 'rich'" class="richtext-editor-only">
            <QuillEditor v-model:content="badgeForm.badge_text" content-type="html" theme="snow" :options="quillOptions" />
          </div>
          <el-input v-else v-model="badgeForm.badge_text" type="textarea" :rows="6" placeholder="请输入 HTML 代码" />
        </el-form-item>
        <el-form-item label="类型" prop="badge_type">
          <el-select v-model="badgeForm.badge_type" placeholder="请选择类型">
            <el-option v-for="item in badgeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="position">
          <el-select v-model="badgeForm.position" placeholder="请选择位置">
            <el-option v-for="item in badgePositionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="badgeForm.sort" :min="0" class="number-input" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="badgeForm.status" placeholder="请选择状态">
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startAt">
          <el-date-picker v-model="badgeForm.startAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可空" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endAt">
          <el-date-picker v-model="badgeForm.endAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="badgeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="badgeSubmitting" @click="handleBadgeSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { STATUS_OPTIONS } from "@/config/enums";
import { getPriceDetail } from "@/api/membership/prices";
import type { PriceBadgeView, PriceView } from "@/api/membership/prices/type";
import { getPlanOptions } from "@/api/membership/plans";
import type { PlanOption } from "@/api/membership/plans/type";
import { createPriceDisplay, deletePriceDisplay, updatePriceDisplay } from "@/api/membership/priceDisplays";
import { createPriceBadge, deletePriceBadge, updatePriceBadge } from "@/api/membership/priceBadges";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);
const priceDetail = ref<PriceView | null>(null);
const planOptions = ref<PlanOption[]>([]);

const displayDialogVisible = ref(false);
const displayDialogTitle = ref("新增配置");
const displayFormRef = ref();
const displaySubmitting = ref(false);
const displayEditorMode = ref<"rich" | "html">("rich");

const badgeDialogVisible = ref(false);
const badgeDialogTitle = ref("新增标签");
const badgeFormRef = ref();
const badgeSubmitting = ref(false);
const badgeEditorMode = ref<"rich" | "html">("rich");

const quillOptions = {
  placeholder: "请输入内容"
};

const displayForm = reactive({
  id: null as number | null,
  display_name: "",
  bottom_text: "",
  sub_text: "",
  status: 1,
  startAt: "",
  endAt: "",
  updatedAt: ""
});

const badgeForm = reactive({
  id: null as number | null,
  badge_text: "",
  badge_type: "CUSTOM",
  position: "TOP_LEFT",
  sort: 0,
  status: 1,
  startAt: "",
  endAt: "",
  updatedAt: ""
});

const displayRules = reactive({
  display_name: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        const text = getPlainText(value);
        if (!text) {
          callback(new Error("请输入展示名称"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  endAt: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value && displayForm.startAt && value < displayForm.startAt) {
          callback(new Error("结束时间不能早于开始时间"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ]
});

const badgeRules = reactive({
  badge_text: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        const text = getPlainText(value);
        if (!text) {
          callback(new Error("请输入文案"));
          return;
        }
        if (text.length > 16) {
          callback(new Error("文案长度不能超过 16"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ],
  endAt: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value && badgeForm.startAt && value < badgeForm.startAt) {
          callback(new Error("结束时间不能早于开始时间"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ]
});

const badgeTypeOptions = [
  { label: "闪购", value: "FLASH" },
  { label: "热门", value: "HOT" },
  { label: "特价", value: "SALE" },
  { label: "推荐", value: "RECOMMEND" },
  { label: "自定义", value: "CUSTOM" }
];

const badgePositionOptions = [
  { label: "左上", value: "TOP_LEFT" },
  { label: "右上", value: "TOP_RIGHT" },
  { label: "左下", value: "BOTTOM_LEFT" },
  { label: "右下", value: "BOTTOM_RIGHT" }
];

const sortedBadges = computed(() => {
  const badges = priceDetail.value?.badges || [];
  return [...badges].sort((a, b) => a.sort - b.sort);
});

const getPlainText = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
};

const getStatusLabel = (status?: number) => {
  return STATUS_OPTIONS.find(item => item.value === status)?.label || "-";
};

const getStatusTag = (status?: number) => {
  return STATUS_OPTIONS.find(item => item.value === status)?.tagType || "info";
};

const getPlanName = (planId?: number | null) => {
  if (!planId) return "-";
  return planOptions.value.find(item => item.id === planId)?.plan_name || planId;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const formatDateRange = (startAt?: string | null, endAt?: string | null) => {
  if (!startAt && !endAt) return "-";
  return `${formatDate(startAt)} ~ ${formatDate(endAt)}`;
};

const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return (amount / 100).toFixed(2);
};

const fetchPlanOptions = async () => {
  try {
    const res = await getPlanOptions();
    planOptions.value = res.data || [];
  } catch (error) {
    planOptions.value = [];
  }
};

const fetchDetail = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const res = await getPriceDetail(route.params.id as string);
    priceDetail.value = res.data || null;
  } catch (error) {
    const state = resolveRequestError(error, "获取价格详情失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push({ path: "/admin/membership/prices" });
};

const openDisplayCreate = () => {
  displayDialogTitle.value = "新增配置";
  resetDisplayForm();
  displayDialogVisible.value = true;
};

const openDisplayEdit = () => {
  if (!priceDetail.value?.display) return;
  const display = priceDetail.value.display;
  displayDialogTitle.value = "编辑配置";
  displayForm.id = display.id;
  displayForm.display_name = display.display_name || "";
  displayForm.bottom_text = display.bottom_text || "";
  displayForm.sub_text = display.sub_text || "";
  displayForm.status = display.status;
  displayForm.startAt = display.startAt || "";
  displayForm.endAt = display.endAt || "";
  displayForm.updatedAt = display.updatedAt || "";
  displayDialogVisible.value = true;
};

const handleDisplaySubmit = () => {
  if (!displayFormRef.value) return;
  if (!priceDetail.value) {
    koiMsgError("价格信息未加载");
    return;
  }
  displaySubmitting.value = true;
  displayFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      koiMsgError("验证失败，请检查填写内容");
      displaySubmitting.value = false;
      return;
    }
    try {
      const priceId = priceDetail.value?.id;
      if (!priceId) {
        koiMsgError("价格信息未加载");
        displaySubmitting.value = false;
        return;
      }
      if (!displayForm.id) {
        await createPriceDisplay({
          price_id: priceId,
          display_name: displayForm.display_name,
          bottom_text: displayForm.bottom_text || null,
          sub_text: displayForm.sub_text || null,
          status: displayForm.status,
          startAt: displayForm.startAt || null,
          endAt: displayForm.endAt || null
        });
        koiNoticeSuccess("创建成功");
      } else {
        await updatePriceDisplay(displayForm.id, {
          display_name: displayForm.display_name,
          bottom_text: displayForm.bottom_text || null,
          sub_text: displayForm.sub_text || null,
          status: displayForm.status,
          startAt: displayForm.startAt || null,
          endAt: displayForm.endAt || null,
          updatedAt: displayForm.updatedAt || null
        });
        koiNoticeSuccess("更新成功");
      }
      displayDialogVisible.value = false;
      resetDisplayForm();
      fetchDetail();
    } catch (error) {
      koiNoticeError("保存失败，请稍后重试");
    } finally {
      displaySubmitting.value = false;
    }
  });
};

const handleDisplayDelete = () => {
  if (!priceDetail.value?.display) return;
  koiMsgBox("确认删除展示配置？")
    .then(async () => {
      try {
        await deletePriceDisplay(priceDetail.value?.display?.id as number);
        koiNoticeSuccess("删除成功");
        fetchDetail();
      } catch (error) {
        koiNoticeError("删除失败，请稍后重试");
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

const resetDisplayForm = () => {
  displayForm.id = null;
  displayForm.display_name = "";
  displayForm.bottom_text = "";
  displayForm.sub_text = "";
  displayForm.status = 1;
  displayForm.startAt = "";
  displayForm.endAt = "";
  displayForm.updatedAt = "";
  displayEditorMode.value = "rich";
  displayFormRef.value?.clearValidate();
};

const openBadgeCreate = () => {
  badgeDialogTitle.value = "新增标签";
  resetBadgeForm();
  badgeDialogVisible.value = true;
};

const openBadgeEdit = (row: PriceBadgeView) => {
  badgeDialogTitle.value = "编辑标签";
  badgeForm.id = row.id;
  badgeForm.badge_text = row.badge_text;
  badgeForm.badge_type = row.badge_type || "CUSTOM";
  badgeForm.position = row.position || "TOP_LEFT";
  badgeForm.sort = row.sort ?? 0;
  badgeForm.status = row.status;
  badgeForm.startAt = row.startAt || "";
  badgeForm.endAt = row.endAt || "";
  badgeForm.updatedAt = row.updatedAt || "";
  badgeDialogVisible.value = true;
};

const handleBadgeSubmit = () => {
  if (!badgeFormRef.value) return;
  if (!priceDetail.value) {
    koiMsgError("价格信息未加载");
    return;
  }
  badgeSubmitting.value = true;
  badgeFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      koiMsgError("验证失败，请检查填写内容");
      badgeSubmitting.value = false;
      return;
    }
    try {
      const priceId = priceDetail.value?.id;
      if (!priceId) {
        koiMsgError("价格信息未加载");
        badgeSubmitting.value = false;
        return;
      }
      if (!badgeForm.id) {
        await createPriceBadge({
          price_id: priceId,
          badge_text: badgeForm.badge_text,
          badge_type: badgeForm.badge_type,
          position: badgeForm.position,
          sort: badgeForm.sort,
          status: badgeForm.status,
          startAt: badgeForm.startAt || null,
          endAt: badgeForm.endAt || null
        });
        koiNoticeSuccess("创建成功");
      } else {
        await updatePriceBadge(badgeForm.id, {
          badge_text: badgeForm.badge_text,
          badge_type: badgeForm.badge_type,
          position: badgeForm.position,
          sort: badgeForm.sort,
          status: badgeForm.status,
          startAt: badgeForm.startAt || null,
          endAt: badgeForm.endAt || null,
          updatedAt: badgeForm.updatedAt || null
        });
        koiNoticeSuccess("更新成功");
      }
      badgeDialogVisible.value = false;
      resetBadgeForm();
      fetchDetail();
    } catch (error) {
      koiNoticeError("保存失败，请稍后重试");
    } finally {
      badgeSubmitting.value = false;
    }
  });
};

const handleBadgeDelete = (row: PriceBadgeView) => {
  koiMsgBox(`确认删除标签【${row.badge_text}】？`)
    .then(async () => {
      try {
        await deletePriceBadge(row.id);
        koiNoticeSuccess("删除成功");
        fetchDetail();
      } catch (error) {
        koiNoticeError("删除失败，请稍后重试");
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

const resetBadgeForm = () => {
  badgeForm.id = null;
  badgeForm.badge_text = "";
  badgeForm.badge_type = "CUSTOM";
  badgeForm.position = "TOP_LEFT";
  badgeForm.sort = 0;
  badgeForm.status = 1;
  badgeForm.startAt = "";
  badgeForm.endAt = "";
  badgeForm.updatedAt = "";
  badgeEditorMode.value = "rich";
  badgeFormRef.value?.clearValidate();
};

onMounted(() => {
  fetchPlanOptions();
  fetchDetail();
});
</script>

<style lang="scss" scoped>
.detail-toolbar {
  margin-bottom: 12px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
}

.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-card__title {
  font-weight: 600;
}

.section-card__actions {
  display: flex;
  gap: 8px;
}

.section-empty {
  color: var(--el-text-color-secondary);
  padding: 12px 0;
}

.badge-table {
  width: 100%;
}

.number-input {
  width: 160px;
}

.richtext-editor-only {
  width: 100%;
}

.richtext-content {
  line-height: 1.6;
  word-break: break-word;
}

:deep(.price-display-dialog .el-dialog__body) {
  max-height: 60vh;
  overflow: auto;
}
</style>
