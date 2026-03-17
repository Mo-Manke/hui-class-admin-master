<!-- 文件用途：曲谱识别（OMR）任务详情页 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <template #header>
        <div class="detail-toolbar">
          <div class="detail-toolbar__left">
            <el-button icon="ArrowLeft" plain @click="goBack">返回</el-button>
            <div class="detail-title">任务详情</div>
          </div>
          <div class="detail-toolbar__actions">
            <el-button icon="Refresh" plain :loading="loading" @click="fetchDetail">刷新</el-button>
            <el-button type="warning" plain :disabled="!task" :loading="actionLoading" @click="handleCancel">取消</el-button>
            <el-button type="primary" plain :disabled="!task" :loading="actionLoading" @click="handleRetry">重试</el-button>
            <el-button type="danger" plain :disabled="!task" :loading="actionLoading" @click="handleDelete">删除</el-button>
          </div>
        </div>
      </template>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />

      <div v-else class="detail-body">
        <OmrTaskMeta :task="task" @copy="copyText" />
        <el-descriptions v-if="fileType || fileNamesText" :column="2" border size="small">
          <el-descriptions-item v-if="fileType" label="fileType">{{ fileType }}</el-descriptions-item>
          <el-descriptions-item v-if="fileNamesText" label="fileNames" :span="fileType ? 1 : 2">{{ fileNamesText }}</el-descriptions-item>
        </el-descriptions>

        <OmrTaskPreview
          v-if="isImageTask"
          :thumbnail-url="thumbnailUrl"
          :image-url="imageUrl"
          :thumbnail-loading="thumbnailLoading"
          :image-loading="imageLoading"
          :download-loading="downloadLoading"
          :disabled="!task"
          @thumbnail="loadThumbnail"
          @image="loadImage"
          @json="downloadJson"
          @midi="downloadMidi"
        />
        <el-alert
          v-else
          type="info"
          :closable="false"
          title="非图片类型任务，不支持缩略图/原图预览"
          class="non-image-alert"
        />
        <OmrTaskJsonPanels :params="task?.params" :outputs="task?.outputs" :error="task?.error" />
        <OmrTaskSsePanel
          :logs="sse.logs.value"
          :running="sse.running.value"
          :error="sse.error.value"
          :disabled="!task"
          @start="startSse"
          @stop="sse.stop"
          @clear="clearLogs"
        />
      </div>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { cancelOmrTask, deleteOmrTask, downloadOmrTaskJson, downloadOmrTaskMidi, getOmrTaskDetail, retryOmrTask } from "@/api/omr/admin";
import type { OmrTaskDetail } from "@/api/omr/admin/type";
import { getOmrTaskImage, getOmrTaskThumbnail } from "@/api/omr/tasks";
import { useBlobUrl } from "@/hooks/omr/useBlobUrl";
import { useOmrProgressStream } from "@/hooks/omr/useOmrProgressStream";
import { downloadBlob } from "@/utils/download";
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";
import OmrTaskMeta from "@/views/admin/omr/tasks/components/OmrTaskMeta.vue";
import OmrTaskPreview from "@/views/admin/omr/tasks/components/OmrTaskPreview.vue";
import OmrTaskJsonPanels from "@/views/admin/omr/tasks/components/OmrTaskJsonPanels.vue";
import OmrTaskSsePanel from "@/views/admin/omr/tasks/components/OmrTaskSsePanel.vue";
import { isImageFileType } from "@/utils/omr/fileType";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const actionLoading = ref(false);
const downloadLoading = ref(false);
const thumbnailLoading = ref(false);
const imageLoading = ref(false);
const errorMessage = ref("");
const noPermission = ref(false);

const task = ref<OmrTaskDetail | null>(null);

const fileType = computed(() => String(route.query.fileType || "").trim());
const fileNamesText = computed(() => String(route.query.fileNames || "").trim());
const isImageTask = computed(() => {
  if (!fileType.value) return true;
  return isImageFileType(fileType.value);
});

const thumbnail = useBlobUrl();
const image = useBlobUrl();
const thumbnailUrl = thumbnail.url;
const imageUrl = image.url;

const sse = useOmrProgressStream();

const taskId = () => String(route.params.taskId || "").trim();

const goBack = () => {
  router.back();
};

const fetchDetail = async () => {
  const id = taskId();
  if (!id) return;
  try {
    loading.value = true;
    errorMessage.value = "";
    noPermission.value = false;
    task.value = await getOmrTaskDetail(id);
  } catch (err) {
    const state = resolveRequestError(err, "获取详情失败");
    errorMessage.value = state.message;
    noPermission.value = state.noPermission;
    if (!state.noPermission) {
      koiNoticeError(state.message);
    }
  } finally {
    loading.value = false;
  }
};

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    koiNoticeSuccess("复制成功");
  } catch {
    koiMsgError("复制失败");
  }
};

const loadThumbnail = async () => {
  const id = taskId();
  if (!id) return;
  try {
    thumbnailLoading.value = true;
    const blob = await getOmrTaskThumbnail(id);
    thumbnail.setBlob(blob);
  } catch (err) {
    const state = resolveRequestError(err, "加载缩略图失败");
    koiNoticeError(state.message);
  } finally {
    thumbnailLoading.value = false;
  }
};

const loadImage = async () => {
  const id = taskId();
  if (!id) return;
  try {
    imageLoading.value = true;
    const blob = await getOmrTaskImage(id);
    image.setBlob(blob);
  } catch (err) {
    const state = resolveRequestError(err, "加载原图失败");
    koiNoticeError(state.message);
  } finally {
    imageLoading.value = false;
  }
};

const downloadJson = async () => {
  const id = taskId();
  if (!id) return;
  try {
    downloadLoading.value = true;
    const blob = await downloadOmrTaskJson(id);
    downloadBlob(blob, `omr_${id}.json`);
  } catch (err) {
    const state = resolveRequestError(err, "下载失败");
    koiNoticeError(state.message);
  } finally {
    downloadLoading.value = false;
  }
};

const downloadMidi = async () => {
  const id = taskId();
  if (!id) return;
  try {
    downloadLoading.value = true;
    const blob = await downloadOmrTaskMidi(id);
    downloadBlob(blob, `omr_${id}.mid`);
  } catch (err) {
    const state = resolveRequestError(err, "下载失败");
    koiNoticeError(state.message);
  } finally {
    downloadLoading.value = false;
  }
};

const handleCancel = async () => {
  const id = taskId();
  if (!id) return;
  try {
    await koiMsgBox("确认取消该任务？", "确认操作");
  } catch {
    return;
  }
  try {
    actionLoading.value = true;
    await cancelOmrTask(id);
    koiNoticeSuccess("已提交取消");
    fetchDetail();
  } catch (err) {
    const state = resolveRequestError(err, "取消失败");
    koiNoticeError(state.message);
  } finally {
    actionLoading.value = false;
  }
};

const handleRetry = async () => {
  const id = taskId();
  if (!id) return;
  try {
    await koiMsgBox("确认重试该任务？", "确认操作");
  } catch {
    return;
  }
  try {
    actionLoading.value = true;
    await retryOmrTask(id);
    koiNoticeSuccess("已提交重试");
    fetchDetail();
  } catch (err) {
    const state = resolveRequestError(err, "重试失败");
    koiNoticeError(state.message);
  } finally {
    actionLoading.value = false;
  }
};

const handleDelete = async () => {
  const id = taskId();
  if (!id) return;
  try {
    await koiMsgBox("确认删除该任务？删除后不可恢复。", "确认操作");
  } catch {
    return;
  }
  try {
    actionLoading.value = true;
    await deleteOmrTask(id);
    koiNoticeSuccess("删除成功");
    router.replace("/admin/omr/user-tasks");
  } catch (err) {
    const state = resolveRequestError(err, "删除失败");
    koiNoticeError(state.message);
  } finally {
    actionLoading.value = false;
  }
};

const startSse = () => {
  const id = taskId();
  if (!id) return;
  sse.start(id);
};

const clearLogs = () => {
  sse.logs.value = [];
};

onMounted(() => {
  fetchDetail();
  if (isImageTask.value) {
    loadThumbnail();
  }
});
</script>

<style lang="scss" scoped>
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detail-toolbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.non-image-alert {
  margin-top: 12px;
}
</style>
