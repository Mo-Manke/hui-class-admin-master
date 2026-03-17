import https from "@/utils/axios.ts";

// 获取版本列表
export function getAppVersionList(params) {
    return https.get("/api/admin/app-version", params);
}

// 新增版本
export function createAppVersion(params) {
    return https.post("/api/admin/app-version", params);
}

// 修改版本
export function updateAppVersion(id, params) {
    return https.put("/api/admin/app-version/" + id, params);
}

// 删除版本
export function deleteAppVersion(id) {
    return https.delete("/api/admin/app-version/" + id);
} 