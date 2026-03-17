import https from "@/utils/axios";

export interface SwiperItem {
  id: number;
  swiper_image: string;
  swiper_title?: string;
  swiper_subtitle?: string;
  swiper_url?: string;
  swiper_sort: number;
  swiper_use_state: boolean;
  description?: string;
  swiper_class_id: number;
  swiper_class?: {
    id: number;
    class_name: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SwiperListQuery {
  page?: number;
  limit?: number;
  swiper_class_id?: number | "";
}

export interface SwiperPayload {
  swiper_image: string;
  swiper_title?: string;
  swiper_subtitle?: string;
  swiper_url?: string;
  swiper_sort: number;
  swiper_use_state: boolean;
  description?: string;
  swiper_class_id: number;
}

export function getSwiperList(params: SwiperListQuery) {
  return https.get("/api/admin/swiper", params);
}

export function createSwiper(params: SwiperPayload) {
  return https.post("/api/admin/swiper", params);
}

export function updateSwiper(id: number | string, params: Partial<SwiperPayload>) {
  return https.put(`/api/admin/swiper/${id}`, params);
}

export function deleteSwiperById(id: number | string) {
  return https.delete(`/api/admin/swiper/${id}`);
}
