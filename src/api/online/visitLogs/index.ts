// 文件用途：官网访问日志接口封装
import type { AxiosResponse } from "axios";
import https from "@/utils/axios.ts";
import type { VisitLogDetailResponse, VisitLogListParams, VisitLogListResponse } from "./type";

// 获取访问日志列表
export const getVisitLogList = (params: VisitLogListParams) => {
  return https.get<VisitLogListResponse>("/api/admin/online/visit-logs", params);
};

// 获取访问日志详情
export const getVisitLogDetail = (id: number | string) => {
  return https.get<VisitLogDetailResponse>(`/api/admin/online/visit-logs/${id}`);
};

// 导出访问日志（CSV）
export const exportVisitLogs = (params: VisitLogListParams) => {
  return https.exportExcel<AxiosResponse<Blob>>("/api/admin/online/visit-logs/export", params);
};
