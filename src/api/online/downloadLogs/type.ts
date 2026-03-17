// 文件用途：下载日志接口类型定义

// UA 解析信息
export interface DownloadLogUaInfo {
  // 浏览器信息
  browser?: string | null;
  // 系统信息
  os?: string | null;
  // 设备信息
  device?: string | null;
}

// 下载日志实体
export interface DownloadLogItem {
  // 日志 ID
  id: number;
  // 下载类型
  type: string;
  // IP
  ip: string;
  // 来源页
  referrer: string;
  // 来源域名
  referrer_host: string;
  // UA 字符串
  ua: string;
  // 会话 ID
  session_id: string;
  // 创建时间
  createdAt: string;
  // 更新时间
  updatedAt: string;
  // 解析后的 UA 信息
  ua_info?: DownloadLogUaInfo | null;
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
export type DownloadLogQuickFilter = "1h" | "24h" | "7d" | "30d";

// 排序字段
export type DownloadLogSortBy = "createdAt";

// 排序方向
export type DownloadLogSortOrder = "ASC" | "DESC";

// 列表查询参数
export interface DownloadLogListParams {
  // 页码
  page?: number;
  // 每页数量
  limit?: number;
  // 类型（逗号分隔）
  type?: string;
  // IP
  ip?: string;
  // 会话 ID
  session_id?: string;
  // 来源页
  referrer?: string;
  // UA
  ua?: string;
  // 开始时间
  createdAtFrom?: string;
  // 结束时间
  createdAtTo?: string;
  // 快速筛选
  quick?: DownloadLogQuickFilter;
  // 排序字段
  sort_by?: DownloadLogSortBy;
  // 排序方向
  sort_order?: DownloadLogSortOrder;
}

// 列表响应
export interface DownloadLogListResponse {
  // 状态码
  code: number;
  // 消息
  message: string;
  // 数据
  data: DownloadLogItem[];
  // 分页信息
  pagination: Pagination;
}

// 详情响应
export interface DownloadLogDetailResponse {
  // 状态码
  code: number;
  // 消息
  message: string;
  // 数据
  data: DownloadLogItem;
}
