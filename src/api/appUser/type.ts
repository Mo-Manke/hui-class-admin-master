export interface AppUser {
  id: number;
  avatar?: string;
  nickname: string;
  username: string;
  user_state: number;
  login_ip?: string;
  client_type?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUserListQuery {
  page?: number;
  limit?: number;
  username?: string;
  nickname?: string;
  user_state?: number | "";
}

export interface CreateAppUserPayload {
  username: string;
  password: string;
  nickname: string;
  avatar?: string;
  client_type?: string;
  description?: string;
}

export interface UpdateAppUserPayload {
  username?: string;
  password?: string;
  nickname?: string;
  avatar?: string;
  client_type?: string;
  description?: string;
  login_ip?: string;
  user_state?: number;
}
