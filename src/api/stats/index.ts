import https from "@/utils/axios.ts";

import type { OnlineVisitPreferenceQuery, OnlineVersionListQuery, OnlineVersionQuery } from "./type.ts";

// 用户统计
export function getAppUserStats() {
  return https.get("/api/admin/app-user/stats");
}

// 歌单统计
export function getMusicGatherStats() {
  return https.get("/api/admin/music-gather/stats");
}

// 歌曲总数
export function getMusicTotalCount() {
  return https.get("/api/admin/music/total-count");
}

// 在线-当前在线
export function getOnlineNow() {
  return https.get("/api/admin/online/now");
}

// 在线-最近24小时（按小时聚合：{ hour, avg, max, samples }）
export function getOnlineLast24h(date?: string) {
  const params = date ? { date } : undefined;
  return https.get("/api/admin/online/last24h", params);
}

// 在线-最近N天（日聚合：{ date, min, avg, max, samples }）
export function getOnlineWeekly(days?: number) {
  const params = days ? { days } : undefined;
  return https.get("/api/admin/online/period", params);
}

// 在线-客户端版本分布
export function getOnlineVersion(params?: OnlineVersionQuery) {
  const query = typeof params?.days === "number" ? { days: params.days } : undefined;
  return https.get("/api/admin/online/version", query);
}

// 在线-客户端版本列表（用于下拉筛选）
export function getOnlineVersionList(params?: OnlineVersionListQuery) {
  const query = typeof params?.days === "number" ? { days: params.days } : undefined;
  return https.get("/api/admin/online/version-list", query);
}

// 在线-活跃度（日活）按时间范围聚合
export function getOnlineActivePeriod(days?: number) {
  const params = days ? { days } : undefined;
  return https.get("/api/admin/online/active-period", params);
}

// 在线-活跃度汇总
export function getOnlineActivitySummary() {
  return https.get("/api/admin/online/activity-summary");
}

// 在线-下载量汇总：今天 / 本周 / 本月
export function getOnlineDownloadSummary() {
  return https.get("/api/admin/online/download-summary");
}

// 在线-访问量汇总：今天 / 本周 / 本月
export function getOnlineVisitSummary() {
  return https.get("/api/admin/online/visit-summary");
}

// 访问偏好（页面维度）
export function getOnlineVisitPreference(params?: OnlineVisitPreferenceQuery) {
  const query = typeof params?.top === "number" ? { top: params.top } : undefined;
  return https.get("/api/admin/online/visit-preference", query);
}

// 下载偏好（下载类型维度）
export function getOnlineDownloadPreference() {
  return https.get("/api/admin/online/download-preference");
}

// 重算某个用户的统计数据
export function recomputeUserStats(user_id: number | string) {
  return https.post("/api/admin/stats/recompute-user", { user_id });
}

// 重算所有用户的统计数据
export function recomputeAllStats() {
  return https.post("/api/admin/stats/recompute-all");
}
