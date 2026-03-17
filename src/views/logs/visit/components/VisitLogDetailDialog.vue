<!-- 文件用途：访问日志详情弹窗 -->
<template>
  <el-dialog
    :model-value="modelValue"
    title="访问日志详情"
    width="760px"
    @close="handleClose"
  >
    <div v-loading="loading" class="visit-log-detail">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="页面">{{ detail.page }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ detail.page_title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detail.referrer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Session">{{ detail.session_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="UA" :span="2">{{ detail.ua || '-' }}</el-descriptions-item>
        <el-descriptions-item label="访问时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(detail.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ uaInfo.browser }}</el-descriptions-item>
        <el-descriptions-item label="系统">{{ uaInfo.os }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ uaInfo.device }}</el-descriptions-item>
      </el-descriptions>

      <div class="visit-log-detail__actions">
        <el-button
          type="primary"
          :disabled="!detail?.session_id"
          @click="emit('filter-session', detail?.session_id || '')"
        >
          查看同 Session
        </el-button>
        <el-button
          type="primary"
          :disabled="!detail?.ip"
          @click="emit('filter-ip', detail?.ip || '')"
        >
          查看同 IP
        </el-button>
        <el-button
          type="primary"
          :disabled="!detail?.page"
          @click="emit('filter-page', detail?.page || '')"
        >
          查看同 Page
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { VisitLogItem } from "@/api/online/visitLogs/type";
import { parseUserAgent } from "@/utils/ua";

// 详情数据
const props = defineProps<{
  modelValue: boolean;
  detail: VisitLogItem | null;
  loading: boolean;
}>();

// 事件定义
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "filter-session", value: string): void;
  (e: "filter-ip", value: string): void;
  (e: "filter-page", value: string): void;
}>();

// UA 展示数据
const uaInfo = computed(() => {
  if (props.detail?.ua_info) {
    return {
      browser: props.detail.ua_info.browser || "-",
      os: props.detail.ua_info.os || "-",
      device: props.detail.ua_info.device || "-"
    };
  }
  return parseUserAgent(props.detail?.ua);
});

// 关闭弹窗
const handleClose = () => {
  emit("update:modelValue", false);
};

// 时间格式化
const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.visit-log-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visit-log-detail__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
