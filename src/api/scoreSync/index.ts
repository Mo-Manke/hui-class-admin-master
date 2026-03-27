import https from "@/utils/axios";

export interface ScoreSyncAccount {
  id: number;
  username: string;
  credential_version: number;
  status: boolean;
  bound_user_count: number;
  term_count: number;
  synced_term_count: number;
  has_score_term_count: number;
  empty_term_count: number;
  last_verified_at?: string | null;
  last_success_at?: string | null;
  last_term_synced_at?: string | null;
  last_score_scanned_at?: string | null;
  last_score_synced_at?: string | null;
  last_error_message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoreSyncTask {
  id: number;
  trigger_type: string;
  sync_scope: string;
  status: string;
  user_id?: number | null;
  jw_account_id: number;
  jw_username: string;
  term_code?: string;
  imported_count: number;
  result_message?: string;
  error_message?: string;
  started_at?: string | null;
  finished_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoreManualSyncRequest {
  scope: "terms" | "default_scores" | "term_scores" | "all_scores";
  term_code?: string;
}

export function getScoreSyncAccounts(params?: { page?: number; limit?: number; keyword?: string; status?: boolean }) {
  return https.get("/api/admin/score/accounts", params);
}

export function getScoreSyncTasks(params?: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  sync_scope?: string;
  trigger_type?: string;
}) {
  return https.get("/api/admin/score/tasks", params);
}

export function getScoreSyncTaskDetail(id: number | string) {
  return https.get(`/api/admin/score/tasks/${id}`);
}

export function triggerScoreManualSync(id: number | string, params: ScoreManualSyncRequest) {
  return https.post(`/api/admin/score/accounts/${id}/sync`, params);
}
