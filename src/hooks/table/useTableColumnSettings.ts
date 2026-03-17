// 表格列设置与列宽持久化
import { ref } from "vue";
import type { TableColumnCtx } from "element-plus";
import { koiLocalStorage } from "@/utils/storage";

export interface TableColumnConfig {
  key: string;
  label: string;
  defaultVisible?: boolean;
  defaultWidth?: number;
}

export interface TableColumnState {
  visible: boolean;
  width?: number;
}

type ColumnStateMap = Record<string, TableColumnState>;

const buildDefaultState = (columns: TableColumnConfig[]) => {
  return columns.reduce<ColumnStateMap>((result, column) => {
    result[column.key] = {
      visible: column.defaultVisible !== false,
      width: column.defaultWidth
    };
    return result;
  }, {});
};

export const useTableColumnSettings = (tableKey: string, columns: TableColumnConfig[]) => {
  const storageKey = `table-columns:${tableKey}`;
  const defaultState = buildDefaultState(columns);
  const storedValue = koiLocalStorage.get(storageKey);
  const columnState = ref<ColumnStateMap>(storedValue ? { ...defaultState, ...JSON.parse(storedValue) } : defaultState);

  const persist = () => {
    koiLocalStorage.set(storageKey, JSON.stringify(columnState.value));
  };

  const setVisible = (key: string, visible: boolean) => {
    columnState.value[key] = {
      ...columnState.value[key],
      visible
    };
    persist();
  };

  const setWidth = (key: string, width?: number) => {
    if (!width) return;
    columnState.value[key] = {
      ...columnState.value[key],
      width
    };
    persist();
  };

  const getVisible = (key: string, fallback = true) => {
    return columnState.value[key]?.visible ?? fallback;
  };

  const getWidth = (key: string, fallback?: number) => {
    return columnState.value[key]?.width ?? fallback;
  };

  const handleHeaderDragend = (newWidth: number, _oldWidth: number, column: TableColumnCtx<Record<string, unknown>>) => {
    const columnKey = column.columnKey as string | undefined;
    if (!columnKey) return;
    setWidth(columnKey, newWidth);
  };

  const reset = () => {
    columnState.value = buildDefaultState(columns);
    persist();
  };

  return {
    columnState,
    setVisible,
    getVisible,
    getWidth,
    handleHeaderDragend,
    reset
  };
};
