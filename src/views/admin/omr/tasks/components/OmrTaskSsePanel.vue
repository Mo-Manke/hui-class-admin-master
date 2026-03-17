<template>
  <div class="section">
    <div class="section__title">进度流（SSE）</div>
    <div class="sse-actions">
      <el-button type="primary" plain :disabled="disabled" :loading="running" @click="$emit('start')">开始</el-button>
      <el-button plain :disabled="!running" @click="$emit('stop')">停止</el-button>
      <el-button plain :disabled="!logs.length" @click="$emit('clear')">清空</el-button>
      <el-tag v-if="running" type="success">连接中</el-tag>
      <el-tag v-else type="info">已停止</el-tag>
      <span v-if="error" class="sse-error">错误：{{ error }}</span>
    </div>
    <el-input :model-value="logs.join('\n')" type="textarea" :rows="10" readonly class="sse-log" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  logs: string[];
  running: boolean;
  error: string;
  disabled: boolean;
}>();

defineEmits<{
  (event: "start"): void;
  (event: "stop"): void;
  (event: "clear"): void;
}>();
</script>

<style lang="scss" scoped>
.section {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.section__title {
  font-weight: 600;
  margin-bottom: 10px;
}

.sse-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.sse-error {
  color: #f56c6c;
}

.sse-log {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>

