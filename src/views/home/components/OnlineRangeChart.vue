<template>
  <el-card class="rounded-md" shadow="hover">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="text-sm font-medium">
          {{ mode === 'online' ? '同时在线趋势' : '活跃度趋势' }}
        </div>
        <!-- 分段器居中显示 -->
        <div class="flex justify-center">
          <el-radio-group v-model="mode" size="small">
            <el-radio-button label="online">同时在线趋势</el-radio-button>
            <el-radio-button label="active">每日活跃度趋势</el-radio-button>
          </el-radio-group>
        </div>
        <!-- 右上角筛选控件 -->
        <div class="flex justify-end items-center gap-4">
          <!-- 同时在线趋势：某天 + 时间范围 -->
          <template v-if="mode === 'online'">
            <el-date-picker
              v-model="onlineDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="--"
              size="small"
              style="width: 125px"
            />
            <el-select
              v-model="onlineDays"
              size="small"
              style="width: 125px"
              placeholder="--"
            >
              <el-option :value="7" label="最近7天" />
              <el-option :value="30" label="最近30天" />
              <el-option :value="90" label="最近90天" />
              <el-option :value="180" label="最近180天" />
            </el-select>
          </template>

          <!-- 活跃度：时间范围选择 -->
          <template v-else>
            <el-select
              v-model="activeDays"
              size="small"
              style="width: 125px"
              placeholder="--"
            >
              <el-option :value="7" label="最近7天" />
              <el-option :value="30" label="最近30天" />
              <el-option :value="90" label="最近90天" />
              <el-option :value="180" label="最近180天" />
            </el-select>
          </template>
        </div>
      </div>
    </template>

    <!-- 主体：根据模式切换不同子图表 -->
    <div>
      <OnlineTrendChart v-if="mode === 'online'" :view-type="viewType" :date="onlineDate" :days="onlineDays" />
      <ActiveTrendChart v-else :days="activeDays" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import OnlineTrendChart from './OnlineTrendChart.vue';
import ActiveTrendChart from './ActiveTrendChart.vue';

const mode = ref<'online' | 'active'>('online');
// 同时在线趋势筛选
const onlineDate = ref<string | null>(null);
const onlineDays = ref<number | null>(null);
// 活跃度筛选
const activeDays = ref<number | null>(null);
const viewType = ref<'24h' | 'period'>('24h');


// 默认加载：同时在线趋势 + 最近 30 天
onMounted(() => {
  if (!onlineDate.value && !onlineDays.value && mode.value === 'online') {
    onlineDays.value = 30;
    viewType.value = 'period';
  }
});

// 选择日期 => 24 小时视图，清空天数
watch(onlineDate, (val) => {
  if (val) {
    viewType.value = '24h';
    onlineDays.value = null;
  }
});

// 选择天数 => 区间视图，清空日期
watch(onlineDays, (val) => {
  if (val != null) {
    viewType.value = 'period';
    onlineDate.value = null;
  }
});

// 切换到活跃度时默认选择 30 天
watch(mode, (val) => {
  if (val === 'active' && activeDays.value == null) {
    activeDays.value = 30;
  }
  if (val === 'online' && !onlineDate.value && !onlineDays.value) {
    onlineDays.value = 30;
    viewType.value = 'period';
  }
});
</script>

<style scoped></style>
