<template>
  <el-card shadow="never" class="block-card">
    <template #header>
      <div class="block-title">维护模式</div>
    </template>
    <el-form label-width="110px">
      <el-form-item label="维护开关">
        <el-switch v-model="enabled" />
      </el-form-item>
      <el-form-item label="提示文案">
        <el-input v-model="message" placeholder="可选，开启维护时返回给客户端的提示文案" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="$emit('save')">保存</el-button>
        <el-button :disabled="saving" @click="$emit('reload')">重新加载</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  saving: boolean;
}>();

defineEmits<{
  (event: "save"): void;
  (event: "reload"): void;
}>();

const enabled = defineModel<boolean>("enabled", { required: true });
const message = defineModel<string>("message", { required: true });
</script>

<style lang="scss" scoped>
.block-card {
  margin-bottom: 12px;
}

.block-title {
  font-weight: 600;
}
</style>

