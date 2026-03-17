// 请求状态解析工具

// 请求错误解析结果
export interface RequestErrorState {
  message: string;
  noPermission: boolean;
}

// 解析接口错误信息
export const resolveRequestError = (error: unknown, fallback = "请求失败"): RequestErrorState => {
  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
        msg?: string;
      };
    };
  };
  const message = err?.response?.data?.message || err?.response?.data?.msg || err?.message || fallback;
  const noPermission = err?.response?.status === 403 || message.includes("无权限");
  return { message, noPermission };
};
