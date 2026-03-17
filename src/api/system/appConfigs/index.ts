import https from "@/utils/axios.ts";
import type { AppConfigCreateRequest, AppConfigListQuery, AppConfigUpdateRequest } from "./type";

export const getAppConfigList = (params: AppConfigListQuery) => {
  return https.get("/api/admin/app-configs", params);
};

export const getAppConfigDetail = (id: number | string) => {
  return https.get(`/api/admin/app-configs/${id}`);
};

export const createAppConfig = (params: AppConfigCreateRequest) => {
  return https.post("/api/admin/app-configs", params);
};

export const updateAppConfig = (id: number | string, params: AppConfigUpdateRequest) => {
  return https.put(`/api/admin/app-configs/${id}`, params);
};
