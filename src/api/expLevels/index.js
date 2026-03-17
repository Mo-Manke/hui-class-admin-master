import https from "@/utils/axios.ts";


export function getExpLevels() {
  return https.get("/api/admin/exp-levels");
}

export function createExpLevel(payload) {
  return https.post("/api/admin/exp-levels", payload);
}

export function updateExpLevel(id, payload) {
  return https.put(`/api/admin/exp-levels/${id}`, payload);
}

export function deleteExpLevel(id) {
  return https.delete(`/api/admin/exp-levels/${id}`);
}
