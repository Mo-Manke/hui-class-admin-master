import https from "@/utils/axios";
import type { AppUserListQuery, CreateAppUserPayload, UpdateAppUserPayload } from "./type";

export function getAppUserList(params: AppUserListQuery) {
  return https.get("/api/admin/app-users", params);
}

export function createAppUser(params: CreateAppUserPayload) {
  return https.post("/api/admin/app-users", params);
}

export function updateAppUser(id: number | string, params: UpdateAppUserPayload) {
  return https.put(`/api/admin/app-users/${id}`, params);
}

export function deleteAppUserById(id: number | string) {
  return https.delete(`/api/admin/app-users/${id}`);
}
