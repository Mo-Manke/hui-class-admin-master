// 文件用途：下载日志接口封装
import type { AxiosResponse } from "axios";
import https from "@/utils/axios.ts";
import type { DownloadLogDetailResponse, DownloadLogListParams, DownloadLogListResponse } from "./type";

// 获取下载日志列表
export const getDownloadLogList = (params: DownloadLogListParams) => {
  return https.get<DownloadLogListResponse>("/api/admin/online/download-logs", params);
};

// 获取下载日志详情
export const getDownloadLogDetail = (id: number | string) => {
  return https.get<DownloadLogDetailResponse>(`/api/admin/online/download-logs/${id}`);
};

// 导出下载日志（CSV）
export const exportDownloadLogs = (params: DownloadLogListParams) => {
  return https.exportExcel<AxiosResponse<Blob>>("/api/admin/online/download-logs/export", params);
};
