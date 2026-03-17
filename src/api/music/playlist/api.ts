import https from "@/utils/axios.ts";

// 获取歌单列表
export function getPlaylistList(params: any) {
    return https.get("/api/admin/music-gather", params);
}

// 创建歌单
export function createPlaylist(params: {
    list_title: string;
    list_cover: string;
    play_number: number;
    look_number: number;
    status: number;
    is_public: boolean;
}) {
    return https.post("/api/admin/music-gather", params);
}

// 更新歌单信息
export function updatePlaylist(id: number | string, params: {
    list_title: string;
    list_cover: string;
    play_number: number;
    look_number: number;
    status: number;
    is_public: boolean;
}) {
    return https.put(`/api/admin/music-gather?id=${id}`, params);
}

// 删除单个歌单
export function deletePlaylistById(id: number | string) {
    return https.delete(`/api/admin/music-gather?id=${id}`);
}

// 批量删除歌单
export function deleteMultiplePlaylists(ids: number[]) {
    return https.post("/api/admin/music-gather/delete-multiple", {ids});
}

// 获取歌单歌曲列表
export function getPlaylistMusicList(params: {
    id: number | string;  // 歌单ID
    page?: number;
    limit?: number;
}) {
    return https.get("/api/admin/gather-music-list", params);
}

// 删除歌单歌曲
export function deletePlaylistMusic(params: {
    id: number | string;     // 歌单ID
    musicId: number | string;  // 歌曲ID
}) {
    return https.delete(`/api/admin/gather-music-list?id=${params.id}&musicId=${params.musicId}`);
}

// 添加歌单歌曲
export function addPlaylistMusic(params: {
    id: number | string;     // 歌单ID
    musicId: number | string;  // 歌曲ID
}) {
    return https.post("/api/admin/gather-music-list", params);
}

// 批量添加歌单歌曲
export function batchAddPlaylistMusic(params: {
    id: number | string;     // 歌单ID
    musicIds: number[] | string[];  // 歌曲ID数组
}) {
    return https.post("/api/admin/gather-musics", params);
} 
