// 曲谱识别（OMR）通用接口
import https from "@/utils/axios";
import type { OmrBatchDeleteRequest } from "./type";

export const getOmrTaskThumbnail = (taskId: string) => {
  return https.get<Blob>(`/api/omr/tasks/${taskId}/thumbnail`, undefined, { responseType: "blob" });
};

export const getOmrTaskImage = (taskId: string) => {
  return https.get<Blob>(`/api/omr/tasks/${taskId}/image`, undefined, { responseType: "blob" });
};

export const batchDeleteOmrTasks = (payload: OmrBatchDeleteRequest) => {
  return https.post("/api/admin/omr/tasks/batch-delete", payload);
};
