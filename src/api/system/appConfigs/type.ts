export interface AppConfigListQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  config_type?: string;
}

export interface AppConfigCreateRequest {
  config_key: string;
  config_value: string;
  config_type: string;
  description?: string | null;
}

export interface AppConfigUpdateRequest {
  config_value?: string | null;
  config_type?: string | null;
  description?: string | null;
}

export interface AppConfigView {
  id: number;
  config_key: string;
  config_value: string;
  config_type: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}
