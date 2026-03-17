// 文件用途：官网访问日志页面状态与逻辑
import { reactive, ref } from "vue";
import { exportVisitLogs, getVisitLogDetail, getVisitLogList } from "@/api/online/visitLogs/index";
import type {
  VisitLogItem,
  VisitLogListParams,
  VisitLogQuickFilter,
  VisitLogSortBy,
  VisitLogSortOrder
} from "@/api/online/visitLogs/type";
import { downloadBlob } from "@/utils/download";
import { koiNoticeError, koiNoticeSuccess } from "@/utils/koi";
import { resolveRequestError } from "@/utils/requestState";

// 筛选条件
export interface VisitLogFilterState {
  // 页面路径
  page_path: string;
  // 页面标题
  page_title: string;
  // 来源页
  referrer: string;
  // 会话 ID
  session_id: string;
  // IP
  ip: string;
  // UA
  ua: string;
  // 关键字
  keyword: string;
  // 快速筛选
  quick: VisitLogQuickFilter | "";
  // 排序字段
  sort_by: VisitLogSortBy;
  // 排序方向
  sort_order: VisitLogSortOrder;
}

// 分页状态
interface VisitLogPaginationState {
  // 当前页
  page: number;
  // 每页数量
  limit: number;
  // 总记录数
  total: number;
}

// 时间范围
export type VisitLogDateRange = [Date, Date] | null;

// 官网访问日志页面逻辑
export const useVisitLogs = () => {
  // 列表加载状态
  const loading = ref(false);
  const errorMessage = ref("");
  const noPermission = ref(false);
  // 导出加载状态
  const exportLoading = ref(false);
  // 列表数据
  const list = ref<VisitLogItem[]>([]);
  // 详情数据
  const detail = ref<VisitLogItem | null>(null);
  // 详情弹窗状态
  const detailVisible = ref(false);
  // 详情加载状态
  const detailLoading = ref(false);
  // 分页数据
  const pagination = reactive<VisitLogPaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });
  // 筛选数据
  const filters = reactive<VisitLogFilterState>({
    page_path: "",
    page_title: "",
    referrer: "",
    session_id: "",
    ip: "",
    ua: "",
    keyword: "",
    quick: "",
    sort_by: "createdAt",
    sort_order: "DESC"
  });
  // 时间范围
  const dateRange = ref<VisitLogDateRange>(null);
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
  const buildParams = (): VisitLogListParams => {
    const params: VisitLogListParams = {
      page: pagination.page,
      limit: pagination.limit,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order
    };

    if (filters.page_path.trim()) params.page_path = filters.page_path.trim();
    if (filters.page_title.trim()) params.page_title = filters.page_title.trim();
    if (filters.referrer.trim()) params.referrer = filters.referrer.trim();
    if (filters.session_id.trim()) params.session_id = filters.session_id.trim();
    if (filters.ip.trim()) params.ip = filters.ip.trim();
    if (filters.ua.trim()) params.ua = filters.ua.trim();
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
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
      const res = await getVisitLogList(buildParams());
      list.value = res.data || [];
      pagination.total = res.pagination?.totalRecords ?? 0;
      pagination.page = res.pagination?.currentPage ?? pagination.page;
      pagination.limit = res.pagination?.pageSize ?? pagination.limit;
    } catch (error) {
      const state = resolveRequestError(error, "获取访问日志失败");
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
    filters.page_path = "";
    filters.page_title = "";
    filters.referrer = "";
    filters.session_id = "";
    filters.ip = "";
    filters.ua = "";
    filters.keyword = "";
    filters.quick = "";
    filters.sort_by = "createdAt";
    filters.sort_order = "DESC";
    dateRange.value = null;
    pagination.page = 1;
    await fetchList();
  };

  // 快速筛选
  const handleQuickFilter = async (value: VisitLogQuickFilter) => {
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
      const response = await exportVisitLogs(buildParams());
      const fileName = `visit-logs-${Date.now()}.csv`;
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
  const openDetail = async (row: VisitLogItem) => {
    try {
      detailVisible.value = true;
      detailLoading.value = true;
      const res = await getVisitLogDetail(row.id);
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
    filters.page_path = "";
    filters.page_title = "";
    filters.referrer = "";
    filters.ua = "";
    filters.keyword = "";
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
    filters.page_path = "";
    filters.page_title = "";
    filters.referrer = "";
    filters.ua = "";
    filters.keyword = "";
    filters.quick = "";
    dateRange.value = null;
    pagination.page = 1;
    await fetchList();
  };

  // 同 Page 筛选
  const filterByPage = async (pagePath: string | null | undefined) => {
    if (!pagePath) return;
    filters.page_path = pagePath;
    filters.session_id = "";
    filters.ip = "";
    filters.page_title = "";
    filters.referrer = "";
    filters.ua = "";
    filters.keyword = "";
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
    filterByPage,
    handlePageChange,
    handleSizeChange
  };
};
