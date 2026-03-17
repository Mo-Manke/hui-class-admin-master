<template>
  <el-table
    ref="tableRef"
    v-loading="loading"
    border
    :data="tableData"
    class="list-table"
    empty-text="暂无数据"
    @header-dragend="handleHeaderDragend"
    @selection-change="handleSelectionChange"
    row-key="taskId"
  >
    <el-table-column type="selection" width="50" align="center" />
    <el-table-column v-if="getVisible('userId')" column-key="userId" label="用户ID" prop="userId" align="center" :width="getWidth('userId', 120)" />
    <el-table-column v-if="getVisible('username')" column-key="username" label="用户名" prop="username" :min-width="getWidth('username', 160)" />
    <el-table-column v-if="getVisible('nickname')" column-key="nickname" label="昵称" prop="nickname" :min-width="getWidth('nickname', 160)" />
    <el-table-column v-if="getVisible('fileType')" column-key="fileType" label="文件类型" prop="fileType" :width="getWidth('fileType', 130)">
      <template #default="{ row }">
        <el-tag :type="isImageFileType(row.fileType) ? 'success' : 'info'">{{ row.fileType || "-" }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column v-if="getVisible('fileNames')" column-key="fileNames" label="文件名" prop="fileNames" :min-width="getWidth('fileNames', 220)">
      <template #default="{ row }">
        <el-tooltip :content="formatFileNamesText(row.fileNames)" placement="top" :disabled="!formatFileNamesText(row.fileNames)">
          <span class="file-names">{{ formatFileNamesText(row.fileNames) || "-" }}</span>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column v-if="getVisible('taskId')" column-key="taskId" label="taskId" prop="taskId" :min-width="getWidth('taskId', 260)">
      <template #default="{ row }">
        <div class="task-id-cell">
          <span class="task-id-cell__text">{{ row.taskId }}</span>
          <el-button type="primary" link @click="$emit('open', row)">打开</el-button>
          <el-button type="info" link @click="$emit('copy', row.taskId)">复制</el-button>
        </div>
      </template>
    </el-table-column>
    <el-table-column v-if="getVisible('createdAt')" column-key="createdAt" label="创建时间" prop="createdAt" align="center" :width="getWidth('createdAt', 180)" />
    <el-table-column v-if="getVisible('updatedAt')" column-key="updatedAt" label="更新时间" prop="updatedAt" align="center" :width="getWidth('updatedAt', 180)" />
    <el-table-column label="操作" align="center" fixed="right" :width="220">
      <template #default="{ row }">
        <div class="action-cell">
          <el-button type="primary" link @click="$emit('open', row)">详情</el-button>
          <el-button type="danger" link :disabled="!row.taskId" :loading="deletingTaskId === row.taskId" @click="$emit('delete', row.taskId)">
            删除
          </el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { TableColumnCtx } from "element-plus";
import type { OmrUserTaskItem } from "@/api/omr/admin/type";
import { formatFileNamesText, isImageFileType } from "@/utils/omr/fileType";

defineProps<{
  loading: boolean;
  tableData: OmrUserTaskItem[];
  deletingTaskId: string;
  getVisible: (key: string) => boolean;
  getWidth: (key: string, fallback?: number) => number | undefined;
}>();

const emit = defineEmits<{
  (event: "open", row: OmrUserTaskItem): void;
  (event: "copy", taskId: string): void;
  (event: "delete", taskId: string): void;
  (event: "header-dragend", newWidth: number, oldWidth: number, column: TableColumnCtx<Record<string, unknown>>): void;
  (event: "selection-change", rows: OmrUserTaskItem[]): void;
}>();

const tableRef = ref<{ clearSelection: () => void } | null>(null);

const handleHeaderDragend = (newWidth: number, oldWidth: number, column: TableColumnCtx<Record<string, unknown>>) => {
  emit("header-dragend", newWidth, oldWidth, column);
};

const handleSelectionChange = (rows: OmrUserTaskItem[]) => {
  emit("selection-change", rows);
};

const clearSelection = () => {
  tableRef.value?.clearSelection();
};

defineExpose({
  clearSelection
});
</script>

<style lang="scss" scoped>
.list-table {
  width: 100%;
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.task-id-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.task-id-cell__text {
  word-break: break-all;
}

.file-names {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
