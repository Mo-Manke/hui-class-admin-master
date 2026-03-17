<!-- 文件用途：访问日志筛选表单与操作区 -->
<template>
  <el-form :inline="true" class="visit-log-filters">
    <el-form-item label="页面">
      <el-input v-model="filters.page_path" placeholder="页面路径" clearable />
    </el-form-item>
    <el-form-item label="标题">
      <el-input v-model="filters.page_title" placeholder="页面标题" clearable />
    </el-form-item>
    <el-form-item label="来源">
      <el-input v-model="filters.referrer" placeholder="referrer" clearable />
    </el-form-item>
    <el-form-item label="会话">
      <el-input v-model="filters.session_id" placeholder="session_id" clearable />
    </el-form-item>
    <el-form-item label="IP">
      <el-input v-model="filters.ip" placeholder="IP" clearable />
    </el-form-item>
    <el-form-item label="UA">
      <el-input v-model="filters.ua" placeholder="User-Agent" clearable />
    </el-form-item>
    <el-form-item label="关键字">
      <el-input v-model="filters.keyword" placeholder="page/ua/referrer 模糊搜索" style="width: 200px" clearable />
    </el-form-item>
    <el-form-item label="时间范围">
      <el-date-picker v-model="dateRangeModel" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间"
        clearable />
    </el-form-item>
    <el-form-item label="排序">
      <el-select v-model="filters.sort_by" placeholder="排序字段" style="width: 178px" clearable>
        <el-option label="创建时间" value="createdAt" />
        <el-option label="页面" value="page" />
      </el-select>
    </el-form-item>
    <el-form-item label="顺序">
      <el-select v-model="filters.sort_order" placeholder="排序顺序" style="width: 178px" clearable>
        <el-option label="倒序" value="DESC" />
        <el-option label="正序" value="ASC" />
      </el-select>
    </el-form-item>
    <el-form-item class="visit-log-filters__actions">
      <el-button type="primary" :loading="loading" @click="emit('search')">搜索</el-button>
      <el-button type="danger" :loading="loading" @click="emit('reset')">重置</el-button>
      <el-button type="success" :loading="exportLoading" @click="emit('export')">导出 CSV</el-button>
    </el-form-item>
  </el-form>
  <div class="visit-log-filters__quick">
      <span class="visit-log-filters__label">快速筛选：</span>
      <el-button v-for="item in quickOptions" :key="item.value"
        :type="filters.quick === item.value ? 'primary' : 'default'" @click="emit('quick', item.value)">
        {{ item.label }}
      </el-button>
      <el-button v-if="filters.quick" @click="emit('clear-quick')">清除快速筛选</el-button>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { VisitLogQuickFilter } from "@/api/online/visitLogs/type";
import type { VisitLogDateRange, VisitLogFilterState } from "@/hooks/visitLogs/useVisitLogs";

// 筛选数据
const props = defineProps<{
  filters: VisitLogFilterState;
  dateRange: VisitLogDateRange;
  loading: boolean;
  exportLoading: boolean;
}>();

// 事件定义
const emit = defineEmits<{
  (e: "search"): void;
  (e: "reset"): void;
  (e: "export"): void;
  (e: "quick", value: VisitLogQuickFilter): void;
  (e: "clear-quick"): void;
  (e: "update:dateRange", value: VisitLogDateRange): void;
}>();

// 时间范围双向绑定
const dateRangeModel = computed<VisitLogDateRange>({
  get: () => props.dateRange,
  set: value => emit("update:dateRange", value)
});

// 快速筛选选项
const quickOptions: Array<{ label: string; value: VisitLogQuickFilter }> = [
  { label: "最近 1h", value: "1h" },
  { label: "最近 24h", value: "24h" },
  { label: "最近 7d", value: "7d" }
];
</script>

<style scoped lang="scss">
.visit-log-filters {
  display: flex;
  flex-wrap: wrap;
}

.visit-log-filters__actions {
  width: 100%;
}

.visit-log-filters__quick {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.visit-log-filters__label {
  color: var(--el-text-color-regular);
}
</style>
