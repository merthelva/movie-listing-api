import type { PaginationType } from '@/common/types/pagination.type';

type ParamsType<T> = {
  items: Array<T>;
  totalItems: number;
  page: number;
  limit: number;
};

export function returnPaginatedData<T>({
  items,
  limit,
  page,
  totalItems,
}: ParamsType<T>): PaginationType & { items: Array<T> } {
  return {
    isFirstPage: page === 1,
    isLastPage: (page - 1) * limit + items.length >= totalItems,
    limit,
    page,
    totalItems,
    items,
  };
}
