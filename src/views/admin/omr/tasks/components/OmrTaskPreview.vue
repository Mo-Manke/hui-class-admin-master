<template>
  <div class="section">
    <div class="section__title">资源预览</div>
    <div class="preview">
      <el-image v-if="thumbnailUrl" :src="thumbnailUrl" fit="contain" class="preview__img" />
      <div v-else class="preview__empty">暂无缩略图</div>
      <el-image v-if="imageUrl" :src="imageUrl" fit="contain" class="preview__img" />
      <div v-else class="preview__empty">暂无原图</div>
    </div>
    <div class="preview-actions">
      <el-button type="primary" plain :loading="thumbnailLoading" @click="$emit('thumbnail')">加载缩略图</el-button>
      <el-button type="primary" plain :loading="imageLoading" @click="$emit('image')">加载原图</el-button>
      <el-button type="success" plain :disabled="disabled" :loading="downloadLoading" @click="$emit('json')">下载 JSON</el-button>
      <el-button type="success" plain :disabled="disabled" :loading="downloadLoading" @click="$emit('midi')">下载 MIDI</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  thumbnailUrl: string;
  imageUrl: string;
  thumbnailLoading: boolean;
  imageLoading: boolean;
  downloadLoading: boolean;
  disabled: boolean;
}>();

defineEmits<{
  (event: "thumbnail"): void;
  (event: "image"): void;
  (event: "json"): void;
  (event: "midi"): void;
}>();
</script>

<style lang="scss" scoped>
.section {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
}

.section__title {
  font-weight: 600;
  margin-bottom: 10px;
}

.preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.preview__img {
  height: 240px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.preview__empty {
  height: 240px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #fafafa;
}

.preview-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>

