<template>
  <el-row :gutter="12" class="grid">
    <el-col :xs="24" :lg="12">
      <div class="section">
        <div class="section__title">params</div>
        <el-input :model-value="formatJson(params)" type="textarea" :rows="10" readonly />
      </div>
    </el-col>
    <el-col :xs="24" :lg="12">
      <div class="section">
        <div class="section__title">outputs</div>
        <el-input :model-value="formatJson(outputs)" type="textarea" :rows="10" readonly />
      </div>
    </el-col>
  </el-row>

  <div class="section">
    <div class="section__title">error</div>
    <el-input :model-value="formatJson(error)" type="textarea" :rows="6" readonly />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  params: unknown;
  outputs: unknown;
  error: unknown;
}>();

const formatJson = (value: unknown) => {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};
</script>

<style lang="scss" scoped>
.grid {
  margin: 0;
}

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
</style>

