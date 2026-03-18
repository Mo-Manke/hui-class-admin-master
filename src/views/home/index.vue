<template>
  <div class="dashboard-page">
    <el-row :gutter="16">
      <el-col v-for="card in cards" :key="card.key" :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ summary[card.key] ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="m-t-16px">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>最近课表抓取</template>
          <div v-if="summary.latest_sync_task" class="task-panel">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务ID">{{ summary.latest_sync_task.id }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="tagType(summary.latest_sync_task.status)">{{ summary.latest_sync_task.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最近更新时间">{{ formatTime(summary.latest_schedule_updated_at) }}</el-descriptions-item>
              <el-descriptions-item label="成功账号">{{ summary.latest_sync_task.account_username || "-" }}</el-descriptions-item>
              <el-descriptions-item label="触发方式">{{ summary.latest_sync_task.trigger_type || "-" }}</el-descriptions-item>
              <el-descriptions-item label="更新条数">{{ summary.latest_sync_task.imported_count || 0 }}</el-descriptions-item>
              <el-descriptions-item label="开始时间">{{ formatTime(summary.latest_sync_task.started_at) }}</el-descriptions-item>
              <el-descriptions-item label="结束时间">{{ formatTime(summary.latest_sync_task.finished_at) }}</el-descriptions-item>
              <el-descriptions-item label="结果摘要" :span="2">{{ summary.latest_sync_task.result_message || "-" }}</el-descriptions-item>
            </el-descriptions>
            <el-alert
              v-if="summary.latest_sync_task.error_message"
              class="m-t-16px"
              type="error"
              :closable="false"
              :title="summary.latest_sync_task.error_message"
            />
          </div>
          <el-empty v-else description="暂无抓取记录" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>快捷入口</template>
          <div class="quick-actions">
            <el-button type="primary" @click="router.push('/schedule-import')">课表抓取</el-button>
            <el-button @click="router.push('/essential')">配置管理</el-button>
            <el-button @click="router.push('/app-users')">用户管理</el-button>
            <el-button @click="router.push('/swiper-image')">轮播图列表</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="homePage">
import { computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { getDashboardSummary } from "@/api/dashboard";

const router = useRouter();

const summary = reactive<Record<string, any>>({
  admin_count: 0,
  app_user_count: 0,
  swiper_count: 0,
  schedule_count: 0,
  latest_schedule_updated_at: null,
  latest_sync_task: null
});

const cards = computed(() => [
  { key: "admin_count", label: "管理员数量" },
  { key: "app_user_count", label: "小程序用户" },
  { key: "swiper_count", label: "轮播图数量" },
  { key: "schedule_count", label: "课表记录数" }
]);

const formatTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
};

const tagType = (status?: string) => {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "warning";
};

const loadSummary = async () => {
  const res = await getDashboardSummary();
  Object.assign(summary, res.data || {});
};

onMounted(loadSummary);
</script>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  border: 1px solid rgba(64, 158, 255, 0.08);
}

.stat-label {
  color: #7a8aa0;
  font-size: 14px;
}

.stat-value {
  margin-top: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #1f2d3d;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
