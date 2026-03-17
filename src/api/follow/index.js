import https from "@/utils/axios.ts";

// 关注列表
export function getFollowing({ user_id, page = 1, limit = 20 }) {
  return https.get("/api/admin/follow/following", { user_id, page, limit });
}

// 粉丝列表
export function getFollowers({ user_id, page = 1, limit = 20 }) {
  return https.get("/api/admin/follow/followers", { user_id, page, limit });
}

// 互相关注列表
export function getMutual({ user_id, page = 1, limit = 20 }) {
  return https.get("/api/admin/follow/mutual", { user_id, page, limit });
}
