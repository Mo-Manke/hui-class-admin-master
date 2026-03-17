// 文件用途：官网访问日志接口类型定义

// UA 解析信息
export interface VisitLogUaInfo {
  // 浏览器信息
  browser?: string | null;
  // 系统信息
  os?: string | null;
  // 设备信息
  device?: string | null;
}

// 访问日志实体
export interface VisitLogItem {
  // 日志 ID
  id: number;
  // 页面路径
  page: string;
  // 页面标题
  page_title?: string | null;
  // 来源页
  referrer?: string | null;
  // 会话 ID
  session_id?: string | null;
  // IP
  ip?: string | null;
  // UA 字符串
  ua?: string | null;
  // 创建时间
  createdAt: string;
  // 更新时间
  updatedAt: string;
  // 解析后的 UA 信息
  ua_info?: VisitLogUaInfo | null;
}

// 分页数据
export interface Pagination {
  // 总记录数
  totalRecords: number;
  // 总页数
  totalPages: number;
  // 当前页
  currentPage: number;
  // 每页数量
  pageSize: number;
}

// 快速筛选
export type VisitLogQuickFilter = "1h" | "24h" | "7d";

// 排序字段
export type VisitLogSortBy = "createdAt" | "page";

// 排序方向
export type VisitLogSortOrder = "ASC" | "DESC";

// 列表查询参数
export interface VisitLogListParams {
  // 页码
  page?: number;
  // 每页数量
  limit?: number;
  // 页面路径
  page_path?: string;
  // 页面标题
  page_title?: string;
  // 来源页
  referrer?: string;
  // 会话 ID
  session_id?: string;
  // IP
  ip?: string;
  // UA
  ua?: string;
  // 开始时间
  createdAtFrom?: string;
  // 结束时间
  createdAtTo?: string;
  // 快速筛选
  quick?: VisitLogQuickFilter;
  // 模糊关键字
  keyword?: string;
  // 排序字段
  sort_by?: VisitLogSortBy;
  // 排序方向
  sort_order?: VisitLogSortOrder;
}

// 列表响应
export interface VisitLogListResponse {
  // 状态码
  code: number;
  // 消息
  message: string;
  // 数据
  data: VisitLogItem[];
  // 分页信息
  pagination: Pagination;
}

// 详情响应
export interface VisitLogDetailResponse {
  // 状态码
  code: number;
  // 消息
  message: string;
  // 数据
  data: VisitLogItem;
}
