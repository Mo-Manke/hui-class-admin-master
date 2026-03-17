<!-- 列表页工具栏 -->
<template>
  <div class="list-toolbar">
    <slot name="left" />
    <div class="list-toolbar__actions">
      <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
        <el-button circle icon="Search" @click="toggleSearch" />
      </el-tooltip>
      <el-tooltip content="刷新" placement="top">
        <el-button circle icon="Refresh" @click="emitRefresh" />
      </el-tooltip>
      <el-tooltip v-if="showExport" content="导出" placement="top">
        <el-button circle icon="Download" @click="emitExport" />
      </el-tooltip>
      <TableColumnSettings
        v-if="columns.length"
        :columns="columns"
        :column-state="columnState"
        @toggle="emitToggle"
        @reset="emitReset"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnConfig, TableColumnState } from "@/hooks/table/useTableColumnSettings";
import TableColumnSettings from "@/components/Common/TableColumnSettings.vue";

interface ListToolbarProps {
  showSearch: boolean;
  showExport?: boolean;
  columns: TableColumnConfig[];
  columnState: Record<string, TableColumnState>;
}

const props = withDefaults(defineProps<ListToolbarProps>(), {
  showExport: false,
  columns: () => [],
  columnState: () => ({})
});

const emit = defineEmits<{
  (event: "update:showSearch", value: boolean): void;
  (event: "refresh"): void;
  (event: "export"): void;
  (event: "toggle-column", key: string, visible: boolean): void;
  (event: "reset-columns"): void;
}>();

const toggleSearch = () => {
  emit("update:showSearch", !props.showSearch);
};

const emitRefresh = () => {
  emit("refresh");
};

const emitExport = () => {
  emit("export");
};

const emitToggle = (key: string, visible: boolean) => {
  emit("toggle-column", key, visible);
};

const emitReset = () => {
  emit("reset-columns");
};
</script>

<style lang="scss" scoped>
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: auto;
}

.list-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
