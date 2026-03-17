// 曲谱识别（OMR）管理端接口类型

export type OmrTaskState = "queued" | "running" | "success" | "failed" | "cancelled";

export interface OmrStorageStats {
  taskCount: number;
  totalSizeMB: number;
  cleanupIntervalHours: number;
  taskMaxAgeHours: number;
}

export interface OmrQueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface OmrSlaveItem {
  workerId: string;
  isBusy: boolean;
  currentTask: string | null;
  tasksCompleted: number;
  tasksFailed: number;
}

export interface OmrSlavesStats {
  enabled: boolean;
  totalSlaves: number;
  busySlaves: number;
  idleSlaves: number;
  pendingTasks: number;
  slaves: OmrSlaveItem[];
}

export interface OmrWorkerConcurrency {
  maxConcurrent: number;
}

export interface OmrMaintenanceState {
  enabled: boolean;
  message?: string | null;
}

export interface OmrMaintenanceUpdateRequest {
  enabled: boolean;
  message?: string;
}

export interface OmrCleanupRequest {
  maxAgeDays?: number;
}

export interface OmrResetStuckTasksRequest {
  taskId?: string;
  maxRunningMinutes?: number;
}

export interface OmrUserTasksQuery {
  userId?: number | string;
  username?: string;
  nickname?: string;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface OmrUserTaskItem {
  userId: number;
  taskId: string;
  fileType?: string | null;
  fileNames?: string[];
  createdAt?: string;
  updatedAt?: string;
  username?: string | null;
  nickname?: string | null;
}

export interface OmrUserTasksPayload {
  items: OmrUserTaskItem[];
  total: number;
  limit: number;
  offset: number;
  userId?: number;
}

export interface OmrTaskDetail {
  taskId: string;
  state: OmrTaskState;
  progress: number;
  createdAt: string;
  updatedAt: string;
  queuePosition: number | null;
  queueLength: number;
  params: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error: unknown | null;
}
