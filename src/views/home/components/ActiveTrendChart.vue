<template>
  <div ref="refChart" style="width: 100%; height: 320px" />
</template>

<script setup lang="ts">
import { getOnlineActivePeriod } from "@/api/stats";
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  days: number | null;
}>();

const refChart = ref();
let chart: echarts.ECharts | null = null;

const activeData = ref<Array<{ date: string; dau: number }>>([]);
const loading = ref(false);

async function fetchData() {
  if (!chart) return;

  // 没有天数时直接清空并画空图，不进入 loading
  if (!props.days) {
    activeData.value = [];
    draw();
    return;
  }

  loading.value = true;
  chart.showLoading({ text: "加载中..." });
  try {
    const res = await getOnlineActivePeriod(props.days);
    const d = res?.data || res;
    activeData.value = Array.isArray(d) ? d : d?.list || [];
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

watch(() => props.days, () => {
  fetchData();
});

function resize() {
  chart?.resize();
}

function draw() {
  if (!chart) return;
  chart.clear();

  const dates = activeData.value.map((d) => d.date);
  const dau = activeData.value.map((d) => d.dau ?? 0);

  chart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const p = params as Array<any>;
        if (!p || !p.length) return "";
        const idx = p[0].dataIndex ?? 0;
        const value = dau[idx] ?? 0;
        return "日活跃：" + String(value);
      },
    },
    legend: { data: ["日活跃度趋势"] },
    color: ["#E6A23C"],
    grid: { left: 40, right: 16, top: 40, bottom: 30, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: dates },
    yAxis: { type: "value" },
    series: [
      {
        name: "日活跃度趋势",
        type: "line",
        smooth: true,
        data: dau,
        showSymbol: false,
        lineStyle: { width: 0 },
        areaStyle: {
          opacity: 0.6,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(230, 162, 60, 0.9)" },
            { offset: 1, color: "rgba(230, 162, 60, 0.1)" },
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
</script>

<style scoped></style>
