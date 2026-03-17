import https from "@/utils/axios.ts";
import type { LoginParams } from "./type.ts";

export interface ProfileUpdateParams {
  avatar?: string;
  nickname?: string;
  login_ip?: string;
}

export interface ProfilePasswordUpdateParams {
  old_password: string;
  new_password: string;
}

export function adminLogin(params: LoginParams) {
  return https.post("/api/admin/login", params, { skipAuth: true } as any);
}

export function getUserInfo() {
  return https.get("/api/admin/user-info");
}

export function updateUserInfo(params: ProfileUpdateParams) {
  return https.put("/api/admin/user-updata", params);
}

export function updateUserPassword(params: ProfilePasswordUpdateParams) {
  return https.put("/api/admin/user-updata-password", params);
}
