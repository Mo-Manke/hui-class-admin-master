<template>
  <div ref="refChart" style="width: 100%; height: 350px"></div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { getOnlineDownloadPreference } from "@/api/stats";

const refChart = ref();
const chartInstance = ref<any>();
// data 中保留原始字段：type / count
const chartData = ref<Array<{ name: string; value: number; type?: string; count?: number }>>([]);

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
    const res = await getOnlineDownloadPreference();
    const d = res?.data || res;
    const list = Array.isArray(d) ? d : d?.list || [];
    chartData.value = list.map((item: any) => ({
      ...item,
      name: item.type || "-",
      value: Number(item.count ?? item.value ?? 0),
    }));
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
      text: "用户下载偏好",
      left: "center",
      top: 8,
      textStyle: {
        fontSize: 14,
      },
    },
    tooltip: {
      confine: true,
      trigger: "item",
      formatter: (params: any) => {
        if (!params) return "";
        const { name, value, percent } = params;
        return `${name}<br/>下载次数：${value}<br/>占比：${percent}%`;
      },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      left: "center",
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
        name: "用户下载偏好",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "70%"],
        startAngle: 180,
        endAngle: 360,
        avoidLabelOverlap: true,
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
      },
    ],
  };
  chartInstance.value?.setOption(option);
};

const updateChart = () => {
  if (!chartInstance.value) return;
  const data = Array.isArray(chartData.value) ? chartData.value : [];

  if (!data.length) {
    chartInstance.value.setOption({
      legend: {
        type: "scroll",
        orient: "horizontal",
        bottom: 0,
        left: "center",
        data: [],
      },
      series: [{ data: [] }],
    });
    return;
  }

  chartInstance.value.setOption({
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      left: "center",
      data: data.map((d) => d.name || "-"),
    },
    series: [
      {
        data,
      },
    ],
  });
}

const handleResize = () => {
  chartInstance.value?.resize();
};
</script>

<style scoped></style>
