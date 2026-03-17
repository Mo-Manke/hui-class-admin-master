import https from "@/utils/axios";

export interface SwiperTypeItem {
  id: number;
  class_name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function getSwiperTypeList() {
  return https.get("/api/admin/swiper-type");
}

export function createSwiperType(params: { class_name: string; description?: string }) {
  return https.post("/api/admin/swiper-type", params);
}

export function updateSwiperType(id: number | string, params: { class_name?: string; description?: string }) {
  return https.put(`/api/admin/swiper-type/${id}`, params);
}

export function deleteSwiperType(id: number | string) {
  return https.delete(`/api/admin/swiper-type/${id}`);
}
