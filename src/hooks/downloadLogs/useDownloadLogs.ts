// 文件用途：下载日志页面状态与逻辑
import { reactive, ref } from "vue";
import { exportDownloadLogs, getDownloadLogDetail, getDownloadLogList } from "@/api/online/downloadLogs/index";
import type {
  DownloadLogItem,
  DownloadLogListParams,
  DownloadLogQuickFilter,
  DownloadLogSortBy,
  DownloadLogSortOrder
} from "@/api/online/downloadLogs/type";
import { downloadBlob } from "@/utils/download";
import { koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";

// 筛选条件
export interface DownloadLogFilterState {
  // 类型列表
  types: string[];
  // IP
  ip: string;
  // 会话 ID
  session_id: string;
  // 来源页
  referrer: string;
  // UA
  ua: string;
  // 快速筛选
  quick: DownloadLogQuickFilter | "";
  // 排序字段
  sort_by: DownloadLogSortBy;
  // 排序方向
  sort_order: DownloadLogSortOrder;
}

// 分页状态
interface DownloadLogPaginationState {
  // 当前页
  page: number;
  // 每页数量
  limit: number;
  // 总记录数
  total: number;
}

// 时间范围
export type DownloadLogDateRange = [Date, Date] | null;

// 下载日志页面逻辑
export const useDownloadLogs = () => {
  // 列表加载状态
  const loading = ref(false);
  const errorMessage = ref("");
  const noPermission = ref(false);
  // 导出加载状态
  const exportLoading = ref(false);
  // 列表数据
  const list = ref<DownloadLogItem[]>([]);
  // 详情数据
  const detail = ref<DownloadLogItem | null>(null);
  // 详情弹窗状态
  const detailVisible = ref(false);
  // 详情加载状态
  const detailLoading = ref(false);
  // 分页数据
  const pagination = reactive<DownloadLogPaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });
  // 筛选数据
  const filters = reactive<DownloadLogFilterState>({
    types: [],
    ip: "",
    session_id: "",
    referrer: "",
    ua: "",
    quick: "",
    sort_by: "createdAt",
    sort_order: "DESC"
  });
  // 时间范围
  const dateRange = ref<DownloadLogDateRange>(null);
  // 分页尺寸选项
  const pageSizeOptions = [10, 20, 50, 100, 200];

  // 格式化时间
  const formatDateTime = (value: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const year = value.getFullYear();
    const month = pad(value.getMonth() + 1);
    const day = pad(value.getDate());
    const hour = pad(value.getHours());
    const minute = pad(value.getMinutes());
    const second = pad(value.getSeconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  // 组装查询参数
  const buildParams = (): DownloadLogListParams => {
    const params: DownloadLogListParams = {
      page: pagination.page,
      limit: pagination.limit,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order
    };

    if (filters.types.length) params.type = filters.types.join(",");
    if (filters.ip.trim()) params.ip = filters.ip.trim();
    if (filters.session_id.trim()) params.session_id = filters.session_id.trim();
    if (filters.referrer.trim()) params.referrer = filters.referrer.trim();
    if (filters.ua.trim()) params.ua = filters.ua.trim();
    if (filters.quick) params.quick = filters.quick;

    if (dateRange.value) {
      params.createdAtFrom = formatDateTime(dateRange.value[0]);
      params.createdAtTo = formatDateTime(dateRange.value[1]);
    }

    return params;
  };

  // 获取列表数据
  const fetchList = async () => {
    try {
      loading.value = true;
      errorMessage.value = "";
      noPermission.value = false;
      const res = await getDownloadLogList(buildParams());
      list.value = res.data || [];
      pagination.total = res.pagination?.totalRecords ?? 0;
      pagination.page = res.pagination?.currentPage ?? pagination.page;
      pagination.limit = res.pagination?.pageSize ?? pagination.limit;
    } catch (error) {
      const state = resolveRequestError(error, "获取下载日志失败");
      errorMessage.value = state.message;
      noPermission.value = state.noPermission;
      if (!state.noPermission) {
        koiNoticeError(state.message);
      }
    } finally {
      loading.value = false;
    }
  };

  // 搜索
  const handleSearch = async () => {
    pagination.page = 1;
    await fetchList();
  };

  // 重置
  const handleReset = async () => {
    filters.types = [];
    filters.ip = "";
    filters.session_id = "";
    filters.referrer = "";
    filters.ua = "";
    filters.quick = "";
    filters.sort_by = "createdAt";
    filters.sort_order = "DESC";
    dateRange.value = null;
    pagination.page = 1;
    await fetchList();
  };

  // 快速筛选
  const handleQuickFilter = async (value: DownloadLogQuickFilter) => {
    filters.quick = value;
    dateRange.value = null;
    pagination.page = 1;
    await fetchList();
  };

  // 清除快速筛选
  const clearQuickFilter = async () => {
    filters.quick = "";
    pagination.page = 1;
    await fetchList();
  };

  // 导出 CSV
  const handleExport = async () => {
    try {
      exportLoading.value = true;
      const response = await exportDownloadLogs(buildParams());
      const fileName = `download-logs-${Date.now()}.csv`;
      downloadBlob(response.data, fileName);
      koiNoticeSuccess("导出成功");
    } catch (error) {
      console.log(error);
      koiNoticeError("导出失败");
    } finally {
      exportLoading.value = false;
    }
  };

  // 打开详情
  const openDetail = async (row: DownloadLogItem) => {
    try {
      detailVisible.value = true;
      detailLoading.value = true;
      const res = await getDownloadLogDetail(row.id);
      detail.value = res.data;
    } catch (error) {
      console.log(error);
      koiNoticeError("获取详情失败");
    } finally {
      detailLoading.value = false;
    }
  };

  // 关闭详情
  const closeDetail = () => {
    detailVisible.value = false;
  };

  // 同 Session 筛选
  const filterBySession = async (sessionId: string | null | undefined) => {
    if (!sessionId) return;
    filters.session_id = sessionId;
    filters.ip = "";
    filters.referrer = "";
    filters.ua = "";
    filters.types = [];
    filters.quick = "";
    dateRange.value = null;
    pagination.page = 1;
    await fetchList();
  };

  // 同 IP 筛选
  const filterByIp = async (ip: string | null | undefined) => {
    if (!ip) return;
    filters.ip = ip;
    filters.session_id = "";
    filters.referrer = "";
    filters.ua = "";
    filters.types = [];
    filters.quick = "";
    dateRange.value = null;
    pagination.page = 1;
    await fetchList();
  };

  // 翻页
  const handlePageChange = async (page: number) => {
    pagination.page = page;
    await fetchList();
  };

  // 修改每页数量
  const handleSizeChange = async (size: number) => {
    pagination.limit = size;
    pagination.page = 1;
    await fetchList();
  };

  return {
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
    handlePageChange,
    handleSizeChange
  };
};
