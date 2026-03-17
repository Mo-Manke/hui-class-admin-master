<!-- 文件用途：官网访问日志管理页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <VisitLogFilters
        v-show="showSearch"
        :filters="filters"
        v-model:dateRange="dateRange"
        :loading="loading"
        :export-loading="exportLoading"
        @search="handleSearch"
        @reset="handleReset"
        @export="handleExport"
        @quick="handleQuickFilter"
        @clear-quick="clearQuickFilter"
      />

      <div class="log-toolbar">
        <div></div>
        <div class="log-toolbar__actions">
          <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
            <el-button circle icon="Search" @click="toggleSearch" />
          </el-tooltip>
          <el-tooltip content="刷新" placement="top">
            <el-button circle icon="Refresh" @click="fetchList" />
          </el-tooltip>
          <el-tooltip content="导出" placement="top">
            <el-button circle icon="Download" :loading="exportLoading" @click="handleExport" />
          </el-tooltip>
          <el-tooltip content="设置" placement="top">
            <el-button circle icon="Setting" @click="openSettings" />
          </el-tooltip>
        </div>
      </div>

      <el-result v-if="noPermission" icon="warning" title="无权限访问" sub-title="请联系管理员授权" />
      <el-result v-else-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage" />
      <VisitLogTable
        v-else
        :list="list"
        :loading="loading"
        :pagination="pagination"
        :page-size-options="pageSizeOptions"
        @detail="openDetail"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <VisitLogDetailDialog
        v-model="detailVisible"
        :detail="detail"
        :loading="detailLoading"
        @filter-session="handleFilterSession"
        @filter-ip="handleFilterIp"
        @filter-page="handleFilterPage"
      />
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useVisitLogs } from "@/hooks/visitLogs/useVisitLogs";
import VisitLogFilters from "@/views/logs/visit/components/VisitLogFilters.vue";
import VisitLogTable from "@/views/logs/visit/components/VisitLogTable.vue";
import VisitLogDetailDialog from "@/views/logs/visit/components/VisitLogDetailDialog.vue";

// 日志页面逻辑
const {
  loading,
  errorMessage,
  noPermission,
  exportLoading,
  list,
  detail,
  detailVisible,
  detailLoading,
  pagination,
  filters,
  dateRange,
  pageSizeOptions,
  fetchList,
  handleSearch,
  handleReset,
  handleQuickFilter,
  clearQuickFilter,
  handleExport,
  openDetail,
  closeDetail,
  filterBySession,
  filterByIp,
  filterByPage,
  handlePageChange,
  handleSizeChange
} = useVisitLogs();

const showSearch = ref(true);

const toggleSearch = () => {
  showSearch.value = !showSearch.value;
};

const openSettings = () => {};

// 同 Session 筛选
const handleFilterSession = async (value: string) => {
  await filterBySession(value);
  closeDetail();
};

// 同 IP 筛选
const handleFilterIp = async (value: string) => {
  await filterByIp(value);
  closeDetail();
};

// 同 Page 筛选
const handleFilterPage = async (value: string) => {
  await filterByPage(value);
  closeDetail();
};

onMounted(async () => {
  await fetchList();
});
</script>

<style scoped lang="scss">
.koi-flex {
  width: 100%;
}

.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
}

.log-toolbar__actions {
  display: flex;
  gap: 8px;
}
</style>
