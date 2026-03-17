<!-- 文件用途：下载日志表格与分页 -->
<template>
  <el-table
    v-loading="loading"
    :data="list"
    border
    empty-text="暂时没有数据哟"
    class="download-log-table"
    @row-dblclick="onRowDblClick"
  >
    <el-table-column type="selection" width="55" align="center" />
    <el-table-column label="ID" prop="id" width="80" align="center" />
    <el-table-column label="类型" prop="type" width="100" align="center" />
    <el-table-column label="IP" prop="ip" width="140" />
    <el-table-column label="来源" prop="referrer" min-width="200" :show-overflow-tooltip="true" />
    <el-table-column label="来源域名" prop="referrer_host" min-width="160" :show-overflow-tooltip="true" />
    <el-table-column label="Session" prop="session_id" min-width="160" :show-overflow-tooltip="true" />
    <el-table-column label="UA" prop="ua" min-width="220" :show-overflow-tooltip="true" />
    <el-table-column label="下载时间" width="180">
      <template #default="scope">
        {{ formatTime(scope.row.createdAt) }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="120" fixed="right" align="center">
      <template #default="scope">
        <el-button type="primary" :icon="View" circle plain @click="emit('detail', scope.row)" />
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
    background
    class="download-log-pagination"
    :current-page="pagination.page"
    :page-size="pagination.limit"
    :total="pagination.total"
    :page-sizes="pageSizeOptions"
    layout="total, sizes, prev, pager, next, jumper"
    @current-change="emit('page-change', $event)"
    @size-change="emit('size-change', $event)"
  />
</template>

<script setup lang="ts">
import { View } from "@element-plus/icons-vue";
import type { DownloadLogItem } from "@/api/online/downloadLogs/type";

// 列表数据
defineProps<{
  list: DownloadLogItem[];
  loading: boolean;
  pagination: { page: number; limit: number; total: number };
  pageSizeOptions: number[];
}>();

// 事件定义
const emit = defineEmits<{
  (e: "detail", row: DownloadLogItem): void;
  (e: "page-change", page: number): void;
  (e: "size-change", size: number): void;
}>();

// 双击行查看详情
const onRowDblClick = (row: DownloadLogItem) => {
  emit("detail", row);
};

// 时间格式化
const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.download-log-table {
  width: 100%;
}

.download-log-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}
</style>
