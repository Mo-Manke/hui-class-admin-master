export type LanguageType = "zh" | "en" | null;

export interface UserInfo {
  avatar: string;
  nickname: string;
  username: string;
  login_ip?: string;
  createdAt?: string;
}
