import https from "@/utils/axios.ts";

export function getAppConfigList(params) {
    return https.get("/api/admin/app-config", params);
}

export function upDataConfigs(params) {
    return https.put("/api/admin/app-config", params);
}
