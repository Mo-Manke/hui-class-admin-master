import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { koiMsgError } from "@/utils/koi.ts";
import { LOGIN_URL } from "@/config/index.ts";
import useUserStore from "@/stores/modules/user.ts";
import { getToken } from "@/utils/storage.ts";
import router from "@/routers/index.ts";
import { generateUUID } from "@/utils/index.ts";

const config = {
  baseURL: import.meta.env.VITE_WEB_BASE_API,
  timeout: 100000
};

const ERROR_MESSAGE_MAP: Record<string, string> = {
  "400": "请求参数错误",
  "401": "未授权，请重新登录",
  "403": "无权限访问",
  "404": "资源不存在",
  "409": "数据已更新，请刷新重试",
  VALUE_TYPE_MISMATCH: "字段类型不匹配",
  INVALID_JSON: "JSON 格式错误",
  OUT_OF_RANGE: "数值超出范围"
};

const pendingRequests = new Map<string, AbortController>();

type RequestConfig = InternalAxiosRequestConfig & {
  retry?: number;
  __retryCount?: number;
  cancelKey?: string;
  skipAuth?: boolean;
};

export interface Result<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

const buildRequestKey = (config: AxiosRequestConfig) => {
  const { method, url, params, data } = config;
  return `${method || "get"}|${url || ""}|${JSON.stringify(params || {})}|${JSON.stringify(data || {})}`;
};

export const cancelPendingRequest = (key: string) => {
  const controller = pendingRequests.get(key);
  if (!controller) return;
  controller.abort();
  pendingRequests.delete(key);
};

export const clearPendingRequests = () => {
  pendingRequests.forEach(controller => controller.abort());
  pendingRequests.clear();
};

class Yu {
  private instance: AxiosInstance;

  constructor(baseConfig: AxiosRequestConfig) {
    this.instance = axios.create(baseConfig);
    this.interceptors();
  }

  private interceptors() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RequestConfig;
        requestConfig.headers = requestConfig.headers || {};
        requestConfig.headers["x-trace-id"] = generateUUID();

        const token = getToken();
        if (token && !requestConfig.skipAuth) {
          requestConfig.headers["Authorization"] = `Bearer ${token}`;
        } else {
          delete requestConfig.headers["Authorization"];
        }

        const cancelKey = requestConfig.cancelKey || buildRequestKey(requestConfig);
        requestConfig.cancelKey = cancelKey;
        const controller = new AbortController();
        requestConfig.signal = requestConfig.signal || controller.signal;
        pendingRequests.set(cancelKey, controller);
        return requestConfig;
      },
      error => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        const responseData = (res.data || {}) as { status?: number; code?: number; message?: string; msg?: string };
        const requestConfig = res.config as RequestConfig;
        const requestKey = requestConfig.cancelKey || buildRequestKey(res.config);
        pendingRequests.delete(requestKey);

        const status = responseData.status ?? responseData.code;
        if (status === 200 || (status === undefined && res.status === 200)) {
          return res.data;
        }

        if (status === 401) {
          if (!requestConfig.skipAuth) {
            const userStore = useUserStore();
            userStore.setToken("");
            koiMsgError("登录身份过期，请重新登录");
            router.replace(LOGIN_URL);
          }
          return Promise.reject(res.data);
        }

        const errorCode = String(status ?? "");
        const errorMessage = responseData.message || responseData.msg || ERROR_MESSAGE_MAP[errorCode] || "服务器繁忙，请稍后再试";
        koiMsgError(errorMessage);
        return Promise.reject(errorMessage);
      },
      async error => {
        const requestConfig = error?.config as RequestConfig | undefined;
        const requestKey = requestConfig?.cancelKey || buildRequestKey(error?.config || {});
        pendingRequests.delete(requestKey);

        if (requestConfig && requestConfig.method?.toLowerCase() === "get") {
          const retryCount = requestConfig.retry ?? 1;
          requestConfig.__retryCount = requestConfig.__retryCount || 0;
          if (requestConfig.__retryCount < retryCount) {
            requestConfig.__retryCount += 1;
            return this.instance.request(requestConfig);
          }
        }

        if (error?.response) {
          const status = error.response.status;
          if (status === 401 && !requestConfig?.skipAuth) {
            const userStore = useUserStore();
            userStore.setToken("");
            koiMsgError("登录身份过期，请重新登录");
            router.replace(LOGIN_URL);
            return Promise.reject(error);
          }

          const messageMap: Record<number, string> = {
            400: "错误请求",
            401: "未授权，请重新登录",
            403: "对不起，您没有权限访问",
            404: "请求错误，未找到请求路径",
            405: "请求方法未允许",
            408: "请求超时",
            500: "服务器开小差了，请重试",
            501: "网络未实现",
            502: "网络错误",
            503: "服务不可用",
            504: "网络超时",
            505: "HTTP 版本不支持该请求"
          };
          koiMsgError(messageMap[status] || `连接错误${status}`);
        } else {
          koiMsgError("连接到服务器失败");
        }

        return Promise.reject(error);
      }
    );
  }

  get<T = Result>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, { params, ...(config || {}) });
  }

  post<T = Result>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  put<T = Result>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  patch<T = Result>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  delete<T = Result>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  upload<T = Result>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, params, {
      ...(config || {}),
      headers: {
        "Content-Type": "multipart/form-data",
        ...((config && config.headers) || {})
      }
    });
  }

  exportExcel<T = Result>(url: string, params?: object): Promise<T> {
    return axios.get(import.meta.env.VITE_SERVER + url, {
      params,
      headers: {
        Accept: "application/vnd.ms-excel",
        Authorization: "Bearer " + getToken()
      },
      responseType: "blob"
    });
  }
}

export default new Yu(config);
