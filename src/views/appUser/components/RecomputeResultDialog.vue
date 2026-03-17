<template>
  <el-dialog v-model="visible" title="用户数据" width="560px">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="音乐数">{{ result?.music_count ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="粉丝数">{{ result?.followers_count ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="关注数">{{ result?.following_count ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="互相关注数">{{ result?.mutual_count ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="收藏总数">{{ result?.music_collection_total ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="热度总数">{{ result?.music_heat_total ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="歌单数">{{ result?.gather_count ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="歌单播放总数">{{ result?.gather_play_total ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="歌单浏览总数">{{ result?.gather_view_total ?? 0 }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="close">我知道了</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="js">
import {computed, defineEmits, defineProps} from 'vue';

const props = defineProps({ modelValue: Boolean, data: Object });
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

const result = computed(() => props.data || {});

function close() {
  emit('update:modelValue', false);
}

function formatDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString();
}
</script>

<style scoped></style>
