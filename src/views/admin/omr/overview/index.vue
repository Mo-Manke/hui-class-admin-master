<!-- 文件用途：曲谱识别（OMR）概览/运维页 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <template #header>
        <div class="page-header">
          <div class="page-header__title">曲谱识别 · 概览/运维</div>
          <div class="page-header__actions">
            <el-button type="primary" plain icon="Refresh" :loading="loading" @click="refreshAll">刷新</el-button>
          </div>
        </div>
      </template>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <div v-else class="page-body">
        <OmrSummaryCards :storage-stats="storageStats" :queue-stats="queueStats" :slaves-stats="slavesStats" />

        <el-row :gutter="12">
          <el-col :xs="24" :lg="10">
            <OmrMaintenancePanel
              v-model:enabled="maintenanceForm.enabled"
              v-model:message="maintenanceForm.message"
              :saving="maintenanceSaving"
              @save="saveMaintenance"
              @reload="refreshMaintenance"
            />
          </el-col>
          <el-col :xs="24" :lg="14">
            <OmrOpsPanel
              v-model:maxAgeDays="cleanupForm.maxAgeDays"
              v-model:taskId="resetForm.taskId"
              v-model:maxRunningMinutes="resetForm.maxRunningMinutes"
              :cleanup-submitting="cleanupSubmitting"
              :reset-submitting="resetSubmitting"
              @cleanup="submitCleanup"
              @reset="submitReset"
            />
          </el-col>
        </el-row>

        <OmrSlavesTable :loading="slavesLoading" :slaves="slavesStats?.slaves || []" @concurrency="openConcurrencyDialog" />
      </div>
    </KoiCard>

    <el-dialog v-model="concurrencyDialogVisible" title="设置 Worker 并发" width="520px">
      <el-form :model="concurrencyForm" label-width="110px">
        <el-form-item label="workerId">
          <el-input v-model="concurrencyForm.workerId" disabled />
        </el-form-item>
        <el-form-item label="maxConcurrent">
          <el-input-number v-model="concurrencyForm.maxConcurrent" :min="1" :max="32" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="concurrencyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="concurrencySaving" @click="saveConcurrency">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  cleanupOmr,
  getOmrMaintenance,
  getOmrQueueStats,
  getOmrSlavesStats,
  getOmrStorageStats,
  getOmrWorkerConcurrency,
  resetOmrStuckTasks,
  setOmrWorkerConcurrency,
  updateOmrMaintenance
} from "@/api/omr/admin";
import type { OmrQueueStats, OmrSlavesStats, OmrStorageStats } from "@/api/omr/admin/type";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";
import OmrSummaryCards from "@/views/admin/omr/overview/components/OmrSummaryCards.vue";
import OmrMaintenancePanel from "@/views/admin/omr/overview/components/OmrMaintenancePanel.vue";
import OmrOpsPanel from "@/views/admin/omr/overview/components/OmrOpsPanel.vue";
import OmrSlavesTable from "@/views/admin/omr/overview/components/OmrSlavesTable.vue";

const loading = ref(false);
const slavesLoading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);

const storageStats = ref<OmrStorageStats | null>(null);
const queueStats = ref<OmrQueueStats | null>(null);
const slavesStats = ref<OmrSlavesStats | null>(null);

const maintenanceForm = reactive({
  enabled: false,
  message: ""
});
const maintenanceSaving = ref(false);

const cleanupForm = reactive({
  maxAgeDays: 7
});
const cleanupSubmitting = ref(false);

const resetForm = reactive({
  taskId: "",
  maxRunningMinutes: 60
});
const resetSubmitting = ref(false);

const concurrencyDialogVisible = ref(false);
const concurrencySaving = ref(false);
const concurrencyForm = reactive({
  workerId: "",
  maxConcurrent: 1
});

const refreshMaintenance = async () => {
  const data = await getOmrMaintenance();
  maintenanceForm.enabled = Boolean(data.enabled);
  maintenanceForm.message = data.message || "";
};

const refreshSlaves = async () => {
  try {
    slavesLoading.value = true;
    slavesStats.value = await getOmrSlavesStats();
  } finally {
    slavesLoading.value = false;
  }
};

const refreshAll = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    const [storage, queue] = await Promise.all([getOmrStorageStats(), getOmrQueueStats()]);
    storageStats.value = storage;
    queueStats.value = queue;
    await Promise.all([refreshMaintenance(), refreshSlaves()]);
  } catch (err) {
    const state = resolveRequestError(err, "获取概览失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

const saveMaintenance = async () => {
  try {
    maintenanceSaving.value = true;
    await updateOmrMaintenance({
      enabled: maintenanceForm.enabled,
      message: maintenanceForm.message || undefined
    });
    koiNoticeSuccess("维护状态已更新");
  } catch (err) {
    const state = resolveRequestError(err, "更新失败");
    koiNoticeError(state.message);
  } finally {
    maintenanceSaving.value = false;
  }
};

const submitCleanup = async () => {
  try {
    await koiMsgBox("确认执行清理操作？此操作会清理历史任务数据。", "确认操作");
  } catch {
    return;
  }
  try {
    cleanupSubmitting.value = true;
    await cleanupOmr({ maxAgeDays: cleanupForm.maxAgeDays });
    koiNoticeSuccess("清理任务已触发");
    refreshAll();
  } catch (err) {
    const state = resolveRequestError(err, "清理失败");
    koiNoticeError(state.message);
  } finally {
    cleanupSubmitting.value = false;
  }
};

const submitReset = async () => {
  try {
    await koiMsgBox("确认重置卡住任务？", "确认操作");
  } catch {
    return;
  }
  try {
    resetSubmitting.value = true;
    await resetOmrStuckTasks({
      taskId: resetForm.taskId || undefined,
      maxRunningMinutes: resetForm.maxRunningMinutes
    });
    koiNoticeSuccess("重置任务已触发");
    refreshAll();
  } catch (err) {
    const state = resolveRequestError(err, "重置失败");
    koiNoticeError(state.message);
  } finally {
    resetSubmitting.value = false;
  }
};

const openConcurrencyDialog = async (workerId: string) => {
  concurrencyForm.workerId = workerId;
  concurrencyForm.maxConcurrent = 1;
  concurrencyDialogVisible.value = true;
  try {
    const concurrency = await getOmrWorkerConcurrency(workerId);
    if (Number.isFinite(concurrency.maxConcurrent)) {
      concurrencyForm.maxConcurrent = concurrency.maxConcurrent;
    }
  } catch (err) {
    const state = resolveRequestError(err, "获取并发失败");
    koiNoticeError(state.message);
  }
};

const saveConcurrency = async () => {
  if (!concurrencyForm.workerId) {
    koiMsgError("缺少 workerId");
    return;
  }
  try {
    concurrencySaving.value = true;
    await setOmrWorkerConcurrency(concurrencyForm.workerId, { maxConcurrent: concurrencyForm.maxConcurrent });
    koiNoticeSuccess("并发已更新");
    concurrencyDialogVisible.value = false;
  } catch (err) {
    const state = resolveRequestError(err, "保存失败");
    koiNoticeError(state.message);
  } finally {
    concurrencySaving.value = false;
  }
};

onMounted(() => {
  refreshAll();
});
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header__title {
  font-size: 16px;
  font-weight: 600;
}

.page-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
