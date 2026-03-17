<!-- 文件用途：下载日志筛选表单与操作区 -->
<template>
  <el-form :inline="true" class="download-log-filters">
    <el-form-item label="类型">
      <el-select
        v-model="filters.types"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="类型（可多选）"
        style="width: 200px"
      >
        <el-option
          v-for="item in typeOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="IP">
      <el-input v-model="filters.ip" placeholder="IP 前缀" clearable />
    </el-form-item>
    <el-form-item label="会话">
      <el-input v-model="filters.session_id" placeholder="session_id" clearable />
    </el-form-item>
    <el-form-item label="来源">
      <el-input v-model="filters.referrer" placeholder="referrer" clearable />
    </el-form-item>
    <el-form-item label="UA">
      <el-input v-model="filters.ua" placeholder="User-Agent" clearable />
    </el-form-item>
    <el-form-item label="时间范围">
      <el-date-picker
        v-model="dateRangeModel"
        type="datetimerange"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        clearable
      />
    </el-form-item>
    <el-form-item label="排序">
      <el-select v-model="filters.sort_by" placeholder="排序字段" style="width: 178px" clearable>
        <el-option label="创建时间" value="createdAt" />
      </el-select>
    </el-form-item>
    <el-form-item label="顺序">
      <el-select v-model="filters.sort_order" placeholder="排序顺序" style="width: 178px" clearable>
        <el-option label="倒序" value="DESC" />
        <el-option label="正序" value="ASC" />
      </el-select>
    </el-form-item>
    <el-form-item class="download-log-filters__actions">
      <el-button type="primary" :loading="loading" @click="emit('search')">搜索</el-button>
      <el-button type="danger" :loading="loading" @click="emit('reset')">重置</el-button>
      <el-button type="success" :loading="exportLoading" @click="emit('export')">导出 CSV</el-button>
    </el-form-item>
  </el-form>

  <div class="download-log-filters__quick">
    <span class="download-log-filters__label">快速筛选：</span>
    <el-button v-for="item in quickOptions" :key="item.value"
      :type="filters.quick === item.value ? 'primary' : 'default'" @click="emit('quick', item.value)">
      {{ item.label }}
    </el-button>
    <el-button v-if="filters.quick" @click="emit('clear-quick')">清除快速筛选</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DownloadLogQuickFilter } from "@/api/online/downloadLogs/type";
import type { DownloadLogDateRange, DownloadLogFilterState } from "@/hooks/downloadLogs/useDownloadLogs";

// 筛选数据
const props = defineProps<{
  filters: DownloadLogFilterState;
  dateRange: DownloadLogDateRange;
  loading: boolean;
  exportLoading: boolean;
}>();

// 事件定义
const emit = defineEmits<{
  (e: "search"): void;
  (e: "reset"): void;
  (e: "export"): void;
  (e: "quick", value: DownloadLogQuickFilter): void;
  (e: "clear-quick"): void;
  (e: "update:dateRange", value: DownloadLogDateRange): void;
}>();

// 时间范围双向绑定
const dateRangeModel = computed<DownloadLogDateRange>({
  get: () => props.dateRange,
  set: value => emit("update:dateRange", value)
});

// 快速筛选选项
const quickOptions: Array<{ label: string; value: DownloadLogQuickFilter }> = [
  { label: "最近 1h", value: "1h" },
  { label: "最近 24h", value: "24h" },
  { label: "最近 7d", value: "7d" },
  { label: "最近 30d", value: "30d" }
];

// 类型选项
const typeOptions = ["APP", "PC"];
</script>

<style scoped lang="scss">
.download-log-filters {
  display: flex;
  flex-wrap: wrap;
}

.download-log-filters__actions {
  width: 100%;
}

.download-log-filters__quick {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.download-log-filters__label {
  color: var(--el-text-color-regular);
}
</style>
