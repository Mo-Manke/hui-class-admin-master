<template>
  <div class="chart-wrapper">
    <div class="chart-actions">
      <el-select v-model="selectedDays" size="small" style="width: 120px" @change="fetchData">
        <el-option v-for="opt in dayOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
    <div ref="refChart" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { getOnlineVersion } from "@/api/stats";

const refChart = ref();
const chartInstance = ref<any>();
const chartData = ref<Array<{ name: string; value: number }>>([]);

const selectedDays = ref<number>(30);
const dayOptions = [
  { label: "30天", value: 30 },
  { label: "90天", value: 90 },
  { label: "180天", value: 180 },
  { label: "360天", value: 360 },
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
    const res = await getOnlineVersion({ days: selectedDays.value });
    const d = res?.data || res;
    const list = Array.isArray(d) ? d : d?.list || [];
    const mapped = list.map((item: any) => ({
      name: item.client_version == null || item.client_version === "" ? "未知" : String(item.client_version),
      value: Number(item.count ?? item.value ?? 0),
    }));

    // 排序规则：1）“未知”永远排在最前面；2）其余版本号提取数字后按数值从小到大排序
    mapped.sort((a: { name: string; value: number }, b: { name: string; value: number }) => {
      const aUnknown = a.name === "未知";
      const bUnknown = b.name === "未知";
      if (aUnknown && !bUnknown) return -1;
      if (!aUnknown && bUnknown) return 1;
      if (aUnknown && bUnknown) return 0;

      const getNumericKey = (name: string) => {
        const parts = String(name).match(/[0-9]+/g);
        if (!parts || !parts.length) return Number.MAX_SAFE_INTEGER;
        // 只保留数字后拼接，再转为数值，例如 '1.3.10' -> '1','3','10' -> 1310
        const joined = parts.join("");
        return Number(joined);
      };

      const aKey = getNumericKey(a.name);
      const bKey = getNumericKey(b.name);
      return bKey - aKey;
    });

    chartData.value = mapped;
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
      text: "客户端版本分布",
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
      formatter: "{b}<br/>数量：{c} ({d}%)",
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
        name: "客户端版本",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
          formatter: "{b}: {c} ({d}%)",
          fontSize: 11,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
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

  // 根据数据生成图例选中状态：默认不选中 name 为 “未知” 的项
  const legendSelected: Record<string, boolean> = {};
  data.forEach((item) => {
    if (!item || typeof item.name === "undefined") return;
    legendSelected[item.name] = item.name !== "未知";
  });

  chartInstance.value.setOption({
    legend: {
      selected: legendSelected,
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
