<template>
  <el-card shadow="never" class="block-card">
    <template #header>
      <div class="block-title">运维操作</div>
    </template>

    <el-row :gutter="12">
      <el-col :xs="24" :md="12">
        <div class="op-block">
          <div class="op-block__title">手动清理</div>
          <el-form label-width="120px">
            <el-form-item label="maxAgeDays">
              <el-input-number v-model="maxAgeDays" :min="1" :max="365" controls-position="right" />
            </el-form-item>
            <el-form-item>
              <el-button type="danger" plain :loading="cleanupSubmitting" @click="$emit('cleanup')">执行</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="op-block">
          <div class="op-block__title">重置卡住任务</div>
          <el-form label-width="140px">
            <el-form-item label="taskId(可选)">
              <el-input v-model="taskId" clearable placeholder="不填则按超时阈值批量重置" />
            </el-form-item>
            <el-form-item label="maxRunningMinutes">
              <el-input-number v-model="maxRunningMinutes" :min="1" :max="1440" controls-position="right" />
            </el-form-item>
            <el-form-item>
              <el-button type="danger" plain :loading="resetSubmitting" @click="$emit('reset')">执行</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  cleanupSubmitting: boolean;
  resetSubmitting: boolean;
}>();

defineEmits<{
  (event: "cleanup"): void;
  (event: "reset"): void;
}>();

const maxAgeDays = defineModel<number>("maxAgeDays", { required: true });
const taskId = defineModel<string>("taskId", { required: true });
const maxRunningMinutes = defineModel<number>("maxRunningMinutes", { required: true });
</script>

<style lang="scss" scoped>
.block-card {
  margin-bottom: 12px;
}

.block-title {
  font-weight: 600;
}

.op-block {
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 10px;
}

.op-block__title {
  font-weight: 600;
  margin-bottom: 8px;
}
</style>

