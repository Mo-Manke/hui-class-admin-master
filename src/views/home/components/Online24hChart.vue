<template>
  <el-card class="rounded-md" shadow="hover">
    <template #header>
      <div class="flex justify-between items-center">
        <span>近24小时在线（按小时）</span>
        <el-date-picker
          v-model="innerDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          size="small"
          style="width: 125px"
          @change="onDateChange"
        />
      </div>
    </template>
    <div ref="refChart" style="width: 100%; height: 320px" />
  </el-card>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onMounted, onUnmounted, ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps<{
  data: Array<{ hour: string; avg: number; max: number; samples: number }>
  date: string
  loading?: boolean
}>();

const emit = defineEmits<{
  (e: 'change-date', date: string): void
}>();

const refChart = ref();
let chart: echarts.ECharts | null = null;

const innerDate = ref<string>(props.date);
watch(() => props.date, v => { innerDate.value = v; });

onMounted(() => {
  chart = echarts.init(refChart.value);
  draw();
  if (props.loading) chart.showLoading({ text: '加载中...' });
  window.addEventListener('resize', resize);
});

onUnmounted(() => {
  chart?.dispose();
  chart = null;
  window.removeEventListener('resize', resize);
});

watch(() => props.data, draw, { deep: true });
watch(() => props.loading, v => {
  if (!chart) return;
  if (v) chart.showLoading({ text: '加载中...' });
  else chart.hideLoading();
});

function resize() {
  chart?.resize();
}

function onDateChange(val: string) {
  // 传递 YYYY-MM-DD
  if (val) emit('change-date', val as unknown as string);
}

function draw() {
  if (!chart) return;
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const map = new Map(props.data.map(d => [d.hour, d]));
  const avgSeries = hours.map(h => map.get(h)?.avg ?? 0);
  const maxSeries = hours.map(h => map.get(h)?.max ?? 0);
  const samples = hours.map(h => map.get(h)?.samples ?? 0);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params as Array<any>;
        const idx = p[0]?.dataIndex ?? 0;
        return `小时 ${hours[idx]}<br/>平均: ${avgSeries[idx]}<br/>最高: ${maxSeries[idx]}<br/>样本: ${samples[idx]}`;
      }
    },
    legend: { data: ['平均', '最高'] },
    xAxis: { type: 'category', data: hours },
    yAxis: { type: 'value' },
    series: [
      { name: '平均', type: 'line', smooth: true, data: avgSeries },
      { name: '最高', type: 'line', smooth: true, data: maxSeries }
    ]
  });
}
</script>

<style scoped></style>

