import type { Result } from "@/utils/axios";

// 分页结构统一适配
export interface PaginationInfo {
  totalRecords?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  nextCursor?: string;
  hasMore?: boolean;
}

interface PaginationResponse {
  pagination?: {
    totalRecords?: number;
    totalPages?: number;
    currentPage?: number;
    pageSize?: number;
  };
  cursor?: {
    next_cursor?: string;
    has_more?: boolean;
  };
}

export const normalizePagination = (response: PaginationResponse | Result<unknown>): PaginationInfo => {
  const pagination = (response as PaginationResponse).pagination;
  const cursor = (response as PaginationResponse).cursor;

  if (pagination) {
    return {
      totalRecords: pagination.totalRecords ?? 0,
      totalPages: pagination.totalPages ?? 0,
      currentPage: pagination.currentPage ?? 1,
      pageSize: pagination.pageSize ?? 10
    };
  }

  if (cursor) {
    return {
      nextCursor: cursor.next_cursor,
      hasMore: cursor.has_more
    };
  }

  return {};
};
