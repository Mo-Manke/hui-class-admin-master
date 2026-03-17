<template>
  <el-row :gutter="12">
    <el-col v-for="card in cards" :key="card.title" :xs="24" :md="12" :lg="8">
      <el-card shadow="never" class="block-card">
        <template #header>
          <div class="block-title">{{ card.title }}</div>
        </template>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item v-for="item in card.items" :key="item.label" :label="item.label">
            {{ item.value }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OmrQueueStats, OmrSlavesStats, OmrStorageStats } from "@/api/omr/admin/type";

interface SummaryItem {
  label: string;
  value: string | number;
}

interface SummaryCard {
  title: string;
  items: SummaryItem[];
}

const props = defineProps<{
  storageStats: OmrStorageStats | null;
  queueStats: OmrQueueStats | null;
  slavesStats: OmrSlavesStats | null;
}>();

const cards = computed<SummaryCard[]>(() => [
  {
    title: "存储统计",
    items: [
      { label: "任务数", value: props.storageStats?.taskCount ?? "-" },
      { label: "占用(MB)", value: props.storageStats?.totalSizeMB ?? "-" },
      { label: "清理间隔(小时)", value: props.storageStats?.cleanupIntervalHours ?? "-" },
      { label: "最大保留(小时)", value: props.storageStats?.taskMaxAgeHours ?? "-" }
    ]
  },
  {
    title: "队列统计",
    items: [
      { label: "等待", value: props.queueStats?.waiting ?? "-" },
      { label: "处理中", value: props.queueStats?.active ?? "-" },
      { label: "已完成", value: props.queueStats?.completed ?? "-" },
      { label: "失败", value: props.queueStats?.failed ?? "-" },
      { label: "总计", value: props.queueStats?.total ?? "-" }
    ]
  },
  {
    title: "Worker 统计",
    items: [
      { label: "启用", value: props.slavesStats?.enabled ? "是" : "否" },
      { label: "总数", value: props.slavesStats?.totalSlaves ?? "-" },
      { label: "忙碌", value: props.slavesStats?.busySlaves ?? "-" },
      { label: "空闲", value: props.slavesStats?.idleSlaves ?? "-" },
      { label: "待处理任务", value: props.slavesStats?.pendingTasks ?? "-" }
    ]
  }
]);
</script>

<style lang="scss" scoped>
.block-card {
  margin-bottom: 12px;
}

.block-title {
  font-weight: 600;
}
</style>

