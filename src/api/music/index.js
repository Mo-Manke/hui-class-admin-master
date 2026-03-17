import https from "@/utils/axios.ts";


//获取音乐列表
export function getMusicList(params) {
  return https.get("/api/admin/music", params);
}

//创建音乐
export function createMusic(params) {
  return https.post("/api/admin/music", params);
}

//删除单个音乐
export function deleteMusicById(id) {
  return https.delete("/api/admin/music/" + id);
}

//删除多个音乐
export function deleteMultipleMusic(ids) {
  return https.post("/api/admin/music/delete-multiple", {ids});
}

//修改音乐信息
export function updateMusic(id, params) {
  return https.put("/api/admin/music/" + id, params);
}
