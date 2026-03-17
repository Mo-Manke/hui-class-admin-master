<template>
  <div class="chart-wrapper">
    <div class="chart-actions">
      <el-select v-model="selectedTop" size="small" style="width: 120px" @change="fetchData">
        <el-option v-for="opt in topOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
    <div ref="refChart" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { getOnlineVisitPreference } from "@/api/stats";

const refChart = ref();
const chartInstance = ref<any>();
// data 中会保留原始字段：page / page_title / count
const chartData = ref<Array<{ name: string; value: number; page?: string; page_title?: string; count?: number }>>([]);

const selectedTop = ref<number>(10);
const topOptions = [
  { label: "前10", value: 10 },
  { label: "前20", value: 20 },
  { label: "前30", value: 30 },
  { label: "全部", value: 0 },
];

onMounted(() => {
  initChart();
  fetchData();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
  }
  window.removeEventListener("resize", handleResize);
});

watch(
  () => chartData.value,
  () => {
    updateChart();
  },
  { deep: true }
);

async function fetchData() {
  try {
    const res = await getOnlineVisitPreference({ top: selectedTop.value });
    const d = res?.data || res;
    const list = Array.isArray(d) ? d : d?.list || [];
    chartData.value = list.map((item: any) => {
      const title = item.page_title || item.page || "";
      const page = item.page || "";
      return {
        ...item,
        name: title || page || "-",
        value: Number(item.count ?? item.value ?? 0),
        page,
        page_title: title,
      };
    });
  } catch (e) {
    chartData.value = [];
  } finally {
    updateChart();
  }
}

const initChart = () => {
  if (!refChart.value) return;
  chartInstance.value = echarts?.init(refChart.value);
  const option = {
    title: {
      text: "官网页面访问偏好",
      left: "center",
      top: 8,
      textStyle: {
        fontSize: 14,
      },
      subtextStyle: {
        fontSize: 12,
        color: "#909399",
      },
    },
    tooltip: {
      confine: true,
      trigger: "item",
      formatter: (params: any) => {
        if (!params) return "";
        const data = params.data || {};
        const title = data.page_title || data.page || params.name || "-";
        const path = data.page || "";
        const value = data.count ?? params.value ?? 0;
        const percent = params.percent ?? "-";
        const pathLine = path ? `<br/>路径：${path}` : "";
        return `${title}${pathLine}<br/>访问次数：${value}<br/>占比：${percent}%`;
      },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
    },
    color: [
      "#409EFF",
      "#67C23A",
      "#E6A23C",
      "#F56C6C",
      "#909399",
      "#9B59B6",
      "#1ABC9C",
    ],
    series: [
      {
        name: "访问页面",
        type: "pie",
        radius: "55%",
        center: ["50%", "50%"],
        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: {
          show: true,
          position: "outside",
          formatter: "{b}: {c} ({d}%)",
          fontSize: 11,
        },
        labelLine: {
          show: true,
          smooth: true,
          length: 10,
          length2: 6,
        },
        data: [],
        animationType: "scale",
        animationEasing: "elasticOut",
        animationDelay: (_: number) => Math.random() * 200,
      },
    ],
  };
  chartInstance.value?.setOption(option);
};

const updateChart = () => {
  if (!chartInstance.value) return;
  const raw = Array.isArray(chartData.value) ? chartData.value : [];
  const data = raw;
  const legendNames = data.map((d: any) => (d && d.name) || "-");

  // 默认禁用标题中包含 "404" 的页面（如 404 页面），避免干扰整体统计展示
  const selected: Record<string, boolean> = {};
  data.forEach((item: any) => {
    const name = (item && item.name) || "-";
    const title = (item && (item.page_title || name)) || "";
    const lower = String(title).toLowerCase();
    // 只要标题里包含 404（不区分大小写），默认不选中
    selected[name] = !lower.includes("404");
  });

  chartInstance.value.setOption({
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      data: legendNames,
      selected,
    },
    series: [
      {
        data,
      },
    ],
  });
};

const handleResize = () => {
  chartInstance.value?.resize();
};
</script>

<style scoped>
 .chart-wrapper {
   position: relative;
   width: 100%;
   height: 350px;
 }

 .chart-actions {
   position: absolute;
   right: 8px;
   top: 8px;
   z-index: 1;
 }

 .chart-container {
   width: 100%;
   height: 100%;
 }
 </style>
