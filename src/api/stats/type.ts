export interface OnlineVersionQuery {
  days?: number;
}

export interface OnlineVersionListQuery {
  days?: number;
}

export interface OnlineVisitPreferenceQuery {
  top?: number;
}

export interface OnlineVersionItem {
  client_version: string | null;
  count: number;
}

export interface OnlineVisitPreferenceItem {
  page: string;
  page_title: string | null;
  count: number;
}

export type OnlineVersionListItem = string;
