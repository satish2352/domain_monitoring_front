import { useState, type ChangeEvent } from 'react';
import { useFetch } from './useFetch';

interface PagedResponse<T> {
  items: T[];
  total?: number;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

/**
 * Server-side pagination on top of useFetch. Builds `?limit=&offset=` (merging any
 * query already on `base`) and exposes a props object ready to spread onto MUI's
 * <TablePagination>. `extraQuery` carries filters; changing it resets to page 0.
 */
export function usePagedFetch<T>(base: string, opts: { rowsPerPage?: number; extraQuery?: string } = {}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(opts.rowsPerPage ?? 25);

  // Reset to the first page whenever the filter query changes.
  const [lastExtra, setLastExtra] = useState(opts.extraQuery ?? '');
  if ((opts.extraQuery ?? '') !== lastExtra) {
    setLastExtra(opts.extraQuery ?? '');
    setPage(0);
  }

  const sep = base.includes('?') ? '&' : '?';
  const extra = opts.extraQuery ? `&${opts.extraQuery}` : '';
  const url = `${base}${sep}limit=${rowsPerPage}&offset=${page * rowsPerPage}${extra}`;

  const { data, loading, error, reload, setData } = useFetch<PagedResponse<T>>(url, [url]);
  const items = data?.items ?? [];
  const total = data?.total ?? items.length;

  return {
    items,
    total,
    data,
    loading,
    initialLoading: loading && !data,
    error,
    reload,
    setData,
    page,
    rowsPerPage,
    setPage,
    paginationProps: {
      component: 'div' as const,
      count: total,
      page,
      rowsPerPage,
      rowsPerPageOptions: ROWS_PER_PAGE_OPTIONS,
      onPageChange: (_e: unknown, p: number) => setPage(p),
      onRowsPerPageChange: (e: ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); },
    },
  };
}
