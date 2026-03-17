<template>
  <el-card shadow="never" class="block-card">
    <template #header>
      <div class="block-title">Worker 列表</div>
    </template>

    <el-table v-loading="loading" border :data="slaves" empty-text="暂无数据">
      <el-table-column label="workerId" prop="workerId" min-width="180" />
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isBusy ? 'warning' : 'success'">{{ row.isBusy ? "忙碌" : "空闲" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="当前任务" prop="currentTask" min-width="200" />
      <el-table-column label="完成" prop="tasksCompleted" width="100" align="center" />
      <el-table-column label="失败" prop="tasksFailed" width="100" align="center" />
      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('concurrency', row.workerId)">并发设置</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import type { OmrSlaveItem } from "@/api/omr/admin/type";

defineProps<{
  loading: boolean;
  slaves: OmrSlaveItem[];
}>();

defineEmits<{
  (event: "concurrency", workerId: string): void;
}>();
</script>

<style lang="scss" scoped>
.block-card {
  margin-bottom: 12px;
}

.block-title {
  font-weight: 600;
}
</style>

