<!-- 表格列设置组件 -->
<template>
  <el-dropdown trigger="click">
    <el-button circle icon="Setting" />
    <template #dropdown>
      <div class="column-settings">
        <div class="column-settings__title">列显示</div>
        <el-checkbox
          v-for="column in columns"
          :key="column.key"
          :model-value="getVisible(column.key, column.defaultVisible)"
          @change="handleChange(column.key, $event)"
        >
          {{ column.label }}
        </el-checkbox>
        <div class="column-settings__actions">
          <el-button type="primary" text @click="emitReset">重置</el-button>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import type { TableColumnConfig, TableColumnState } from "@/hooks/table/useTableColumnSettings";

interface ColumnSettingsProps {
  columns: TableColumnConfig[];
  columnState: Record<string, TableColumnState>;
}

const props = defineProps<ColumnSettingsProps>();
const emit = defineEmits<{
  (event: "toggle", key: string, visible: boolean): void;
  (event: "reset"): void;
}>();

const getVisible = (key: string, fallback = true) => {
  return props.columnState[key]?.visible ?? fallback;
};

const handleToggle = (key: string, visible: boolean) => {
  emit("toggle", key, visible);
};

const handleChange = (key: string, visible: boolean) => {
  handleToggle(key, visible);
};

const emitReset = () => {
  emit("reset");
};
</script>

<style lang="scss" scoped>
.column-settings {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 10px 12px;
  gap: 6px;
}

.column-settings__title {
  font-size: 12px;
  color: #606266;
}

.column-settings__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
