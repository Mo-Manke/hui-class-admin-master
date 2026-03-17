import https from "@/utils/axios.ts";
import type { GraphicsCaptcha } from "./type.ts";

enum API {
  GRAPHICS_CAPTCHA = "/api/common/graphicsCaptcha"
}

export const getGraphicsCaptcha = (params: GraphicsCaptcha) => {
  return https.get(API.GRAPHICS_CAPTCHA, params, { skipAuth: true, retry: 0 } as any);
};
