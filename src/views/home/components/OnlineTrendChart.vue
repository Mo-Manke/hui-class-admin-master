<template>
  <div ref="refChart" style="width: 100%; height: 320px" />
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { getOnlineLast24h, getOnlineWeekly } from "@/api/stats";

const props = defineProps<{
  viewType: "24h" | "period";
  date: string | null;
  days: number | null;
}>();

const refChart = ref();
let chart: echarts.ECharts | null = null;

const last24hData = ref<Array<{ hour: string; avg: number; max: number; samples: number }>>([]);
const weeklyData = ref<Array<{ date: string; min: number; avg: number; max: number; samples: number }>>([]);
const loading = ref(false);

async function fetchData() {
  if (!chart) return;

  // 先处理没有参数的情况：直接清空并画空图，不进入 loading
  if (props.viewType === "24h" && !props.date) {
    last24hData.value = [];
    draw();
    return;
  }
  if (props.viewType === "period" && !props.days) {
    weeklyData.value = [];
    draw();
    return;
  }

  loading.value = true;
  chart.showLoading({ text: "加载中..." });
  try {
    if (props.viewType === "24h") {
      const res = await getOnlineLast24h(props.date as string);
      const raw = res?.data || res;
      const list = Array.isArray(raw) ? raw : raw?.list || [];
      if (!list.length) {
        // 服务端返回空数组时，手动构造 24 小时全 0 数据，避免看起来像一直在加载
        const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
        last24hData.value = hours.map((h) => ({ hour: h, avg: 0, max: 0, samples: 0 }));
      } else {
        last24hData.value = list;
      }
    } else {
      const res = await getOnlineWeekly(props.days as number);
      const raw = res?.data || res;
      weeklyData.value = Array.isArray(raw) ? raw : raw?.list || [];
    }
  } finally {
    loading.value = false;
    chart.hideLoading();
  }
  draw();
}

onMounted(async () => {
  chart = echarts.init(refChart.value as HTMLDivElement);
  await fetchData();
  window.addEventListener("resize", resize);
});

onUnmounted(() => {
  chart?.dispose();
  chart = null;
  window.removeEventListener("resize", resize);
});

watch(() => [props.viewType, props.date, props.days], () => {
  fetchData();
});

function resize() {
  chart?.resize();
}

function draw() {
  if (!chart) return;
  chart.clear();

  if (props.viewType === "24h") {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    const map = new Map(last24hData.value.map((d) => [d.hour, d]));
    const avgSeries = hours.map((h) => map.get(h)?.avg ?? 0);
    const maxSeries = hours.map((h) => map.get(h)?.max ?? 0);
    const samples = hours.map((h) => map.get(h)?.samples ?? 0);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params as Array<any>;
          const idx = p[0]?.dataIndex ?? 0;
          return `小时 ${hours[idx]}<br/>平均: ${avgSeries[idx]}<br/>最高: ${maxSeries[idx]}<br/>样本: ${samples[idx]}`;
        },
      },
      legend: { data: ["平均", "最高"] },
      color: ["#409EFF", "#67C23A"],
      grid: { left: 40, right: 16, top: 40, bottom: 30, containLabel: true },
      xAxis: { type: "category", boundaryGap: false, data: hours },
      yAxis: { type: "value" },
      series: [
        {
          name: "平均",
          type: "line",
          smooth: true,
          data: avgSeries,
          stack: "online-total",
          showSymbol: false,
          lineStyle: { width: 0 },
          areaStyle: {
            opacity: 0.6,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 158, 255, 0.9)" },
              { offset: 1, color: "rgba(64, 158, 255, 0.1)" },
            ]),
          },
          markPoint: {
            symbol: "pin",
            symbolSize: 40,
            label: {
              show: true,
              formatter: "{c}",
              color: "#fff",
              fontSize: 10,
            },
            data: [
              { type: "max", name: "最高值" },
              { type: "min", name: "最低值" },
            ],
          },
        },
        {
          name: "最高",
          type: "line",
          smooth: true,
          data: maxSeries,
          stack: "online-total",
          showSymbol: false,
          lineStyle: { width: 0 },
          areaStyle: {
            opacity: 0.6,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(103, 194, 58, 0.9)" },
              { offset: 1, color: "rgba(103, 194, 58, 0.1)" },
            ]),
          },
          markPoint: {
            symbol: "pin",
            symbolSize: 40,
            label: {
              show: true,
              formatter: "{c}",
              color: "#fff",
              fontSize: 10,
            },
            data: [
              { type: "max", name: "最高值" },
              { type: "min", name: "最低值" },
            ],
          },
        },
      ],
    });
  } else {
    const dates = weeklyData.value.map((d) => d.date);
    const avg = weeklyData.value.map((d) => d.avg ?? 0);
    const max = weeklyData.value.map((d) => d.max ?? 0);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params as Array<any>;
          if (!p || !p.length) return "";
          const idx = p[0].dataIndex ?? 0;
          const date = dates[idx] ?? "";
          return `日期 ${date}<br/>日均: ${avg[idx]}<br/>日最高: ${max[idx]}`;
        },
      },
      legend: { data: ["日均", "日最高"] },
      color: ["#409EFF", "#67C23A"],
      grid: { left: 40, right: 16, top: 40, bottom: 30, containLabel: true },
      xAxis: { type: "category", boundaryGap: false, data: dates },
      yAxis: { type: "value" },
      series: [
        {
          name: "日均",
          type: "line",
          smooth: true,
          data: avg,
          stack: "online-period-total",
          showSymbol: false,
          lineStyle: { width: 0 },
          areaStyle: {
            opacity: 0.6,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 158, 255, 0.9)" },
              { offset: 1, color: "rgba(64, 158, 255, 0.1)" },
            ]),
          },
          markPoint: {
            symbol: "pin",
            symbolSize: 40,
            label: {
              show: true,
              formatter: "{c}",
              color: "#fff",
              fontSize: 10,
            },
            data: [
              { type: "max", name: "最高值" },
              { type: "min", name: "最低值" },
            ],
          },
        },
        {
          name: "日最高",
          type: "line",
          smooth: true,
          data: max,
          stack: "online-period-total",
          showSymbol: false,
          lineStyle: { width: 0 },
          areaStyle: {
            opacity: 0.6,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(103, 194, 58, 0.9)" },
              { offset: 1, color: "rgba(103, 194, 58, 0.1)" },
            ]),
          },
          markPoint: {
            symbol: "pin",
            symbolSize: 40,
            label: {
              show: true,
              formatter: "{c}",
              color: "#fff",
              fontSize: 10,
            },
            data: [
              { type: "max", name: "最高值" },
              { type: "min", name: "最低值" },
            ],
          },
        },
      ],
    });
  }
}
</script>

<style scoped></style>
