import https from "@/utils/axios.ts";

// 兑换码列表
export function getExchangeCodeList(params) {
  return https.get("/api/admin/exchange-code", params);
}
// 批量生成兑换码
export function generateExchangeCode(params) {
  return https.post("/api/admin/exchange-code", params);
}
// 修改兑换码
export function updateExchangeCode(id, params) {
  return https.put(`/api/admin/exchange-code/${id}`, params);
}
// 删除单个兑换码
export function deleteExchangeCode(id) {
  return https.delete(`/api/admin/exchange-code/${id}`);
}
// 批量删除兑换码
export function deleteMultipleExchangeCode(ids) {
  return https.post("/api/admin/exchange-code/delete-multiple", { ids });
}
// 获取兑换码使用记录
export function getExchangeCodeRecords(id) {
  return https.get(`/api/admin/exchange-code/${id}/records`);
}
