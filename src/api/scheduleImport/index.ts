import https from "@/utils/axios";

export interface ScheduleAccount {
  id: number;
  username: string;
  remark?: string;
  sort: number;
  status: boolean;
  last_success_at?: string | null;
  last_error_message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleTask {
  id: number;
  trigger_type: string;
  status: string;
  source_scope?: string;
  source_key?: string;
  account_id?: number | null;
  account_username?: string;
  attempt_count: number;
  imported_count: number;
  result_message?: string;
  error_message?: string;
  attempt_log?: string;
  started_at?: string | null;
  finished_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleSettings {
  id: number;
  enabled: boolean;
  cron_expr: string;
  term_start_date?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function getScheduleAccounts(params?: { page?: number; limit?: number; keyword?: string; status?: boolean }) {
  return https.get("/api/admin/schedule/accounts", params);
}

export function createScheduleAccount(params: {
  username: string;
  password: string;
  remark?: string;
  sort: number;
  status: boolean;
}) {
  return https.post("/api/admin/schedule/accounts", params);
}

export function getScheduleAccountDetail(id: number | string) {
  return https.get(`/api/admin/schedule/accounts/${id}`);
}

export function updateScheduleAccount(
  id: number | string,
  params: {
    username?: string;
    password?: string;
    remark?: string;
    sort?: number;
    status?: boolean;
  }
) {
  return https.put(`/api/admin/schedule/accounts/${id}`, params);
}

export function deleteScheduleAccount(id: number | string) {
  return https.delete(`/api/admin/schedule/accounts/${id}`);
}

export function getScheduleSettings() {
  return https.get("/api/admin/schedule/settings");
}

export function updateScheduleSettings(params: { enabled: boolean; cron_expr: string; term_start_date: string }) {
  return https.put("/api/admin/schedule/settings", params);
}

export function triggerScheduleCrawl() {
  return https.post("/api/admin/schedule/crawl", { mode: "manual" });
}

export function getScheduleTasks(params?: { page?: number; limit?: number }) {
  return https.get("/api/admin/schedule/tasks", params);
}

export function getScheduleTaskDetail(id: number | string) {
  return https.get(`/api/admin/schedule/tasks/${id}`);
}
