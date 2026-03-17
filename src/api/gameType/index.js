import https from "@/utils/axios.ts";

//获取音乐列表
export function getGameTypeList(params) {
    return https.get("/api/admin/game-type", params);
}

//新增游戏类型
export function createGameType(params) {
    return https.post("/api/admin/game-type", params);
}

//修改游戏类型
export function updateGameType(id, params) {
    return https.put("/api/admin/game-type/" + id, params);
}

//删除单个音乐
export function deleteGameType(id) {
    return https.delete("/api/admin/game-type/" + id);
}

//删除多个音乐
export function deleteMultipleGameType(ids) {
    return https.post("/api/admin/game/delete-multiple", {ids});
}

//获取游戏键位类型列表
export function getGameKeyTypeList(gameId) {
    return https.get("/api/admin/game-key-type", { game_id: gameId });
}

//新增游戏键位类型
export function createGameKeyType(params) {
    return https.post("/api/admin/game-key-type", params);
}

//修改游戏键位类型
export function updateGameKeyType(id, params) {
    return https.put("/api/admin/game-key-type/" + id, params);
}

//删除游戏键位类型
export function deleteGameKeyType(id) {
    return https.delete("/api/admin/game-key-type/" + id);
}
