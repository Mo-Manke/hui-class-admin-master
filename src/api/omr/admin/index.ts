// 曲谱识别（OMR）管理端接口
import https, { Result } from "@/utils/axios";
import type {
  OmrCleanupRequest,
  OmrMaintenanceState,
  OmrMaintenanceUpdateRequest,
  OmrQueueStats,
  OmrResetStuckTasksRequest,
  OmrSlavesStats,
  OmrStorageStats,
  OmrTaskDetail,
  OmrUserTasksPayload,
  OmrUserTasksQuery,
  OmrWorkerConcurrency
} from "./type";
import { normalizeFileNames } from "@/utils/omr/fileType";

type ApiMaybeWrapped<T> = Result<T> | { data: T } | T;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const unwrap = <T>(res: ApiMaybeWrapped<T>): T => {
  if (isRecord(res) && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
};

// 按 task/omr/task.md：管理端建议使用兼容前缀
const OMR_ADMIN_COMPAT_PREFIX = "/api/admin/omr";
const buildAdminUrl = (path: string) => `${OMR_ADMIN_COMPAT_PREFIX}${path}`;

export const getOmrStorageStats = async (): Promise<OmrStorageStats> => {
  const res = await https.get<ApiMaybeWrapped<OmrStorageStats>>(buildAdminUrl("/stats"));
  return unwrap(res);
};

export const getOmrQueueStats = async (): Promise<OmrQueueStats> => {
  const res = await https.get<ApiMaybeWrapped<OmrQueueStats>>(buildAdminUrl("/queue/stats"));
  return unwrap(res);
};

export const getOmrSlavesStats = async (): Promise<OmrSlavesStats> => {
  const res = await https.get<ApiMaybeWrapped<OmrSlavesStats>>(buildAdminUrl("/slaves/stats"));
  return unwrap(res);
};

export const getOmrWorkerConcurrency = async (workerId: string): Promise<OmrWorkerConcurrency> => {
  const res = await https.get<ApiMaybeWrapped<OmrWorkerConcurrency>>(buildAdminUrl(`/slaves/${workerId}/concurrency`));
  return unwrap(res);
};

export const setOmrWorkerConcurrency = (workerId: string, payload: OmrWorkerConcurrency) => {
  return https.put(buildAdminUrl(`/slaves/${workerId}/concurrency`), payload);
};

export const getOmrMaintenance = async (): Promise<OmrMaintenanceState> => {
  const res = await https.get<ApiMaybeWrapped<OmrMaintenanceState>>(buildAdminUrl("/maintenance"));
  return unwrap(res);
};

export const updateOmrMaintenance = (payload: OmrMaintenanceUpdateRequest) => {
  return https.put(buildAdminUrl("/maintenance"), payload);
};

export const cleanupOmr = (payload: OmrCleanupRequest = {}) => {
  return https.post(buildAdminUrl("/cleanup"), payload);
};

export const resetOmrStuckTasks = (payload: OmrResetStuckTasksRequest) => {
  return https.post(buildAdminUrl("/reset-stuck-tasks"), payload);
};

export const getOmrUserTasks = async (query: OmrUserTasksQuery): Promise<OmrUserTasksPayload> => {
  const limit = query.limit;
  const offset = query.offset;
  const page = query.page ?? (limit && typeof offset === "number" ? Math.floor(offset / limit) + 1 : undefined);
  const res = await https.get<ApiMaybeWrapped<OmrUserTasksPayload>>(buildAdminUrl("/user-tasks"), {
    ...query,
    page
  });
  const payload = unwrap(res) as unknown as OmrUserTasksPayload & { items?: unknown[] };
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];

  const normalizeNumber = (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const normalizeString = (value: unknown) => {
    return String(value ?? "").trim();
  };

  const items = rawItems
    .map(item => {
      if (!isRecord(item)) return null;
      const userId = normalizeNumber(item.userId ?? item.UserID ?? item.user_id ?? item.userID);
      const taskId = normalizeString(item.taskId ?? item.TaskID ?? item.task_id ?? item.taskID);
      if (!taskId) return null;

      const createdAt = normalizeString(item.createdAt ?? item.CreatedAt) || undefined;
      const updatedAt = normalizeString(item.updatedAt ?? item.UpdatedAt) || undefined;
      const username = normalizeString(item.username ?? item.Username) || null;
      const nickname = normalizeString(item.nickname ?? item.Nickname) || null;
      const fileType = normalizeString(item.fileType ?? item.FileType) || null;
      const fileNames = normalizeFileNames(item.fileNames ?? item.FileNames);

      return {
        userId,
        taskId,
        fileType,
        fileNames,
        createdAt,
        updatedAt,
        username,
        nickname
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    items,
    total: Number(payload?.total || 0),
    limit: Number(payload?.limit || 0),
    offset: Number(payload?.offset || 0),
    userId: payload?.userId
  };
};

export const getOmrTaskDetail = async (taskId: string): Promise<OmrTaskDetail> => {
  const res = await https.get<ApiMaybeWrapped<OmrTaskDetail>>(buildAdminUrl(`/tasks/${taskId}`));
  return unwrap(res);
};

export const cancelOmrTask = (taskId: string) => {
  return https.delete(buildAdminUrl(`/tasks/${taskId}`));
};

export const retryOmrTask = (taskId: string) => {
  return https.post(buildAdminUrl(`/tasks/${taskId}/retry`));
};

export const deleteOmrTask = (taskId: string) => {
  return https.delete(buildAdminUrl(`/tasks/${taskId}/delete`));
};

export const downloadOmrTaskJson = (taskId: string) => {
  return https.get<Blob>(buildAdminUrl(`/tasks/${taskId}/json`), undefined, { responseType: "blob" });
};

export const downloadOmrTaskMidi = (taskId: string) => {
  return https.get<Blob>(buildAdminUrl(`/tasks/${taskId}/midi`), undefined, { responseType: "blob" });
};
