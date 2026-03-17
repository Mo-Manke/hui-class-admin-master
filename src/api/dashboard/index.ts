import https from "@/utils/axios";

export function getDashboardSummary() {
  return https.get("/api/admin/dashboard/summary");
}
