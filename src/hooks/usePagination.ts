import React from 'react';
import type { DataTableQueryMeta } from '../tableTypes';

export interface UsePaginationArgs {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  perPage: number;
  meta: DataTableQueryMeta | undefined;
  rowCount: number;
}

export function usePagination({ page, setPage, perPage, meta, rowCount }: UsePaginationArgs) {
  const effectivePerPage = Math.max(1, meta?.perPage ?? perPage);
  const totalCount = meta?.total;

  const totalPages = React.useMemo(() => {
    if (totalCount == null || totalCount < 0) return null;
    return Math.max(1, Math.ceil(totalCount / effectivePerPage));
  }, [totalCount, effectivePerPage]);

  // Clamp current page to valid range when totalPages changes
  React.useEffect(() => {
    if (totalPages == null) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages, setPage]);

  const canGoPrev =
    meta?.hasPrevious !== undefined ? meta.hasPrevious : page > 1;

  const canGoNext = React.useMemo(() => {
    if (meta?.hasNext !== undefined) return meta.hasNext;
    if (totalPages != null) return page < totalPages;
    if (page === 1 && rowCount === 0) return false;
    return rowCount >= effectivePerPage;
  }, [meta?.hasNext, totalPages, page, rowCount, effectivePerPage]);

  return { totalPages, totalCount, effectivePerPage, canGoPrev, canGoNext };
}
