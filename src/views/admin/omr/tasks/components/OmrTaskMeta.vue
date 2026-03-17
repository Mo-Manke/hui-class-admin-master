<template>
  <el-descriptions :column="2" border size="small">
    <el-descriptions-item label="taskId" :span="2">
      <div class="id-row">
        <span class="id-row__text">{{ task?.taskId || "-" }}</span>
        <el-button v-if="task?.taskId" type="info" link @click="$emit('copy', task.taskId)">复制</el-button>
      </div>
    </el-descriptions-item>
    <el-descriptions-item label="state">
      <el-tag :type="getStateTag(task?.state)">{{ task?.state || "-" }}</el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="progress">
      <el-progress :percentage="Number(task?.progress || 0)" :status="getProgressStatus(task?.state)" />
    </el-descriptions-item>
    <el-descriptions-item label="queuePosition">{{ formatNullable(task?.queuePosition) }}</el-descriptions-item>
    <el-descriptions-item label="queueLength">{{ formatNullable(task?.queueLength) }}</el-descriptions-item>
    <el-descriptions-item label="createdAt">{{ formatDate(task?.createdAt) }}</el-descriptions-item>
    <el-descriptions-item label="updatedAt">{{ formatDate(task?.updatedAt) }}</el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import type { OmrTaskDetail, OmrTaskState } from "@/api/omr/admin/type";

defineProps<{
  task: OmrTaskDetail | null;
}>();

defineEmits<{
  (event: "copy", value: string): void;
}>();

const formatNullable = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const getStateTag = (state?: OmrTaskState) => {
  if (!state) return "info";
  if (state === "success") return "success";
  if (state === "failed") return "danger";
  if (state === "running") return "warning";
  if (state === "queued") return "info";
  if (state === "cancelled") return "info";
  return "info";
};

const getProgressStatus = (state?: OmrTaskState) => {
  if (state === "success") return "success";
  if (state === "failed") return "exception";
  return undefined;
};
</script>

<style lang="scss" scoped>
.id-row {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.id-row__text {
  word-break: break-all;
}
</style>

