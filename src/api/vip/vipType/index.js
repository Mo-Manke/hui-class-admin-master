import https from "@/utils/axios.ts";

// VIP类型列表
export function getVipTypeList(params) {
    return https.get("/api/admin/vip-type", params);
}
// 新增VIP类型（支持批量）
export function addVipType(params) {
    return https.post("/api/admin/vip-type", params);
}
// 修改VIP类型
export function updateVipType(id, params) {
    return https.put(`/api/admin/vip-type/${id}`, params);
}
// 删除单个VIP类型
export function deleteVipType(id) {
    return https.delete(`/api/admin/vip-type/${id}`);
}
// 批量删除VIP类型
export function deleteMultipleVipType(ids) {
    return https.post("/api/admin/vip-type/delete-multiple", {ids});
}
