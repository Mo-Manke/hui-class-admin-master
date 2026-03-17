import https from "@/utils/axios";

export interface ScheduleImportTask {
  id: number;
  file_name: string;
  source_name?: string;
  status: string;
  imported_count: number;
  replace_mode: boolean;
  error_message?: string;
  createdAt: string;
  updatedAt: string;
}

export function importSchedule(formData: FormData) {
  return https.upload("/api/admin/schedule/import", formData);
}

export function getScheduleImportTasks(params?: { page?: number; limit?: number }) {
  return https.get("/api/admin/schedule/import-tasks", params);
}

export function getScheduleImportTaskDetail(id: number | string) {
  return https.get(`/api/admin/schedule/import-tasks/${id}`);
}
