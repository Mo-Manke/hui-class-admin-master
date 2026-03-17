<template>
  <el-card class="rounded-md" shadow="hover" v-loading="loading">
    <template #header>
      概览统计
    </template>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <div class="text-gray-500 text-sm">用户总数</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="0" :endVal="userStats.total" :duration="1200" />
        </div>
        <div class="text-xs text-gray-500">今日新增 {{ userStats.todayNew }}｜周 {{ userStats.weekNew }}｜月 {{ userStats.monthNew }}</div>
      </div>
      <div>
        <div class="text-gray-500 text-sm">歌单总数</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="0" :endVal="gatherStats.total" :duration="1200" />
        </div>
        <div class="text-xs text-gray-500">今日新增 {{ gatherStats.todayNew }}｜周 {{ gatherStats.weekNew }}｜月 {{ gatherStats.monthNew }}</div>
      </div>
      <div>
        <div class="text-gray-500 text-sm">歌曲总数</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="0" :endVal="musicTotal" :duration="1200" />
        </div>
      </div>
      <div>
        <div class="text-gray-500 text-sm">今日活跃</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="0" :endVal="activitySummary.today" :duration="1200" />
        </div>
        <div class="text-xs text-gray-500">周 {{ activitySummary.week }}｜月 {{ activitySummary.month }}</div>
      </div>
      <div>
        <div class="text-gray-500 text-sm">今日下载量</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="0" :endVal="downloadSummary.today" :duration="1200" />
        </div>
        <div class="text-xs text-gray-500">周 {{ downloadSummary.week }}｜月 {{ downloadSummary.month }}｜累计 {{ downloadSummary.total }}</div>
      </div>
      <div>
        <div class="text-gray-500 text-sm">官网今日访问</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="0" :endVal="visitSummary.today" :duration="1200" />
        </div>
        <div class="text-xs text-gray-500">周 {{ visitSummary.week }}｜月 {{ visitSummary.month }}｜累计 {{ visitSummary.total }}</div>
      </div>
      <div>
        <div class="text-gray-500 text-sm">当前在线人数</div>
        <div class="text-2xl font-bold">
          <CountTo :startVal="prevOnline" :endVal="onlineNow" :duration="1200" />
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
// @ts-ignore
import { CountTo } from 'vue3-count-to';
import { getAppUserStats, getMusicGatherStats, getMusicTotalCount, getOnlineNow, getOnlineActivitySummary, getOnlineDownloadSummary, getOnlineVisitSummary } from '@/api/stats';

// 首次加载动画
const loading = ref(true);

// 本组件内部管理概览数据
const userStats = reactive({ total: 0, todayNew: 0, weekNew: 0, monthNew: 0 });
const gatherStats = reactive({ total: 0, todayNew: 0, weekNew: 0, monthNew: 0 });
const musicTotal = ref(0);
const onlineNow = ref(0);
const activitySummary = reactive({ today: 0, week: 0, month: 0 });
const downloadSummary = reactive({ today: 0, week: 0, month: 0, total: 0 });
const visitSummary = reactive({ today: 0, week: 0, month: 0, total: 0 });

// 为了产生滚动数字效果，记录上一次的在线人数
const prevOnline = ref(0);
watch(() => onlineNow.value, (_new, old) => {
  prevOnline.value = old ?? 0;
}, { immediate: true });

// 轮询定时器 id
let refreshTimer: number | null = null;

onMounted(async () => {
  await fetchOverview();
  loading.value = false;
  // 每 10 秒刷新一次概览数据
  refreshTimer = window.setInterval(() => {
    fetchOverview();
  }, 10_000);
});

onUnmounted(() => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});

async function fetchOverview() {
  const [uRes, gRes, mRes, nRes, aRes, dRes, vRes] = await Promise.all([
    getAppUserStats(),
    getMusicGatherStats(),
    getMusicTotalCount(),
    getOnlineNow(),
    getOnlineActivitySummary(),
    getOnlineDownloadSummary(),
    getOnlineVisitSummary(),
  ]);

  const u = uRes?.data || uRes;
  const g = gRes?.data || gRes;
  const m = mRes?.data || mRes;
  const n = nRes?.data || nRes;
  const a = aRes?.data || aRes;
  const d = dRes?.data || dRes;
  const v = vRes?.data || vRes;

  userStats.total = Number(u.total || 0);
  userStats.todayNew = Number(u.todayNew || 0);
  userStats.weekNew = Number(u.weekNew || 0);
  userStats.monthNew = Number(u.monthNew || 0);

  gatherStats.total = Number(g.total || 0);
  gatherStats.todayNew = Number(g.todayNew || 0);
  gatherStats.weekNew = Number(g.weekNew || 0);
  gatherStats.monthNew = Number(g.monthNew || 0);

  musicTotal.value = Number(m.total || m || 0);
  onlineNow.value = Number((n.count ?? n.total ?? n) || 0);

  activitySummary.today = Number(a.today || 0);
  activitySummary.week = Number(a.week || 0);
  activitySummary.month = Number(a.month || 0);

  downloadSummary.today = Number(d.today || 0);
  downloadSummary.week = Number(d.week || 0);
  downloadSummary.month = Number(d.month || 0);
  downloadSummary.total = Number(d.total || 0);

  visitSummary.today = Number(v.today || 0);
  visitSummary.week = Number(v.week || 0);
  visitSummary.month = Number(v.month || 0);
  visitSummary.total = Number(v.total || 0);
}
</script>

<style scoped></style>
