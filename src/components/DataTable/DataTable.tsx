import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  SortingState,
  flexRender,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { SearchInput } from '../SearchInput/SearchInput';
import { UserActionCell, RowAction } from '../UserActionCell/UserActionCell';
import { ActionButtonsBar, TableAction } from '../ActionButtonsBar/ActionButtonsBar';
import { InlineFiltersUI, type DataTableFiltersUISlot } from '../InlineFiltersUI/InlineFiltersUI';
import type {
  DataTableActionsContext,
  DataTableColumnDef,
  FilterValues,
  MergedTableFilters,
  ModalRegistryHandler,
  OpenModalCallback,
  ServiceQuery,
  ServiceResult,
} from '../../tableTypes';
import { isModalPayload } from '../../tableTypes';
import {
  mergeDataTableClassNames,
  mergeDataTableLabels,
  type DataTableClassNames,
  type DataTableLabels,
  type DataTableLayoutComponents,
} from '../../dataTableLayout';

export type { ServiceQuery, ServiceResult } from '../../tableTypes';

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ').trim();
}

// Configuration object accepted by the DataTable component. Many fields mirror
// the original component’s API but have been made optional or simplified. The
// service property is required.
//
// Use two type parameters so row data and filter shape flow through the table:
// `DataTableConfig<UserRow, UserFilters>` — filters should use optional fields.
export interface DataTableConfig<TRecord, TFilters extends FilterValues = FilterValues> {
  id?: string;
  queryKey?: unknown[];
  service: {
    getAll: (query: ServiceQuery<TFilters>) => Promise<ServiceResult<TRecord>>;
  };
  columns: DataTableColumnDef<TRecord>[];
  rowActions?: RowAction<TRecord, TFilters>[];
  defaultPerPage?: number;
  actions?: TableAction<TRecord, TFilters>[];
  /**
   * Inline filters slot. When set and `renderFilters` is omitted, `DataTable` renders
   * {@link InlineFiltersUI} with this value (function, `{ render }`, or `{ Component, formConfig, onApply }`).
   */
  filtersUI?: DataTableFiltersUISlot<TRecord, TFilters>;
  /**
   * Optional override for the filters region. When set, it replaces the default
   * `InlineFiltersUI` branch (ignores `filtersUI` for that slot).
   */
  renderFilters?: (context: DataTableActionsContext<TRecord, TFilters>) => React.ReactNode;
  recordById?: {
    endpoint: string | ((id: string | number) => string);
    map?: (response: unknown) => TRecord;
  };
  searchFields?: string[];
  pageHeader?: {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
  };
  skeletonRows?: number;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  /**
   * Callback that receives a registry map of modal ids to handlers. Use this
   * function to integrate your application’s modal system. The keys are of
   * the form `action:<id>` or `rowAction:<id>`.
   */
  onRegisterModal?: (registry: Record<string, ModalRegistryHandler<TRecord, TFilters>>) => void;
  /**
   * Callback used to open a modal. When row or table actions return a payload
   * with `type` and `props`, this function is invoked with those values.
   */
  onOpenModal?: OpenModalCallback;
  /**
   * Optional callback invoked once on mount to allow the consumer to hook
   * into URL query parameters or other side effects. It receives the config
   * and the table context.
   */
  onUrlAction?: (args: {
    config: DataTableConfig<TRecord, TFilters>;
    context: DataTableActionsContext<TRecord, TFilters>;
  }) => void;
  /**
   * Tailwind-friendly class names per region. See {@link DEFAULT_DATA_TABLE_CLASSNAMES}
   * (re-exported from the package root). Omit keys you do not override.
   */
  classNames?: Partial<DataTableClassNames>;
  /** Copy for empty/error/pagination. Defaults to English; pass `t(...)` results from i18n. */
  labels?: Partial<DataTableLabels>;
  /**
   * Replace header, toolbar, or table shell with your own layout (glass cards, `PageHeader`, etc.).
   */
  layoutComponents?: DataTableLayoutComponents;
}

export interface DataTableProps<TRecord, TFilters extends FilterValues = FilterValues> {
  config: DataTableConfig<TRecord, TFilters>;
}

/**
 * A configurable data table component built on top of TanStack Table and React
 * Query. It handles server-side pagination and sorting, exposes callbacks for
 * modal integration, and provides search functionality. The table renders
 * actions above the table and row actions within the table. Consumers are
 * responsible for styling via class names or by wrapping the provided UI
 * components.
 *
 * @example
 * ```tsx
 * type Row = { id: string; name: string };
 * type Filters = { status?: 'active' | 'archived' };
 *
 * <DataTable<Row, Filters>
 *   config={{
 *     service: { getAll: async (q) => ({ data: [], meta: { total: 0, page: 1, perPage: 10 } }) },
 *     columns: [...],
 *   }}
 * />
 * ```
 */
export function DataTable<TRecord, TFilters extends FilterValues = FilterValues>({
  config,
}: DataTableProps<TRecord, TFilters>) {
  const tableId = config.id || 'table';
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(config.defaultPerPage ?? 10);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filters, setFilters] = React.useState<MergedTableFilters<TFilters>>(
    () => ({}) as MergedTableFilters<TFilters>
  );
  const [searchValue, setSearchValue] = React.useState('');

  React.useEffect(() => {
    const next = config.defaultPerPage ?? 10;
    setPerPage((prev) => (prev === next ? prev : next));
  }, [config.defaultPerPage]);

  React.useEffect(() => {
    const fields = config.searchFields || [];
    if (fields.length === 0) return;
    if (searchValue && searchValue.trim()) {
      const searchFilter = {
        search: searchValue.trim(),
        searchFields: fields,
      };
      setFilters((prev) => ({ ...prev, ...searchFilter }));
    } else {
      setFilters((prev) => {
        const { search: _s, searchFields: _sf, ...rest } = prev;
        return rest as MergedTableFilters<TFilters>;
      });
    }
    setPage(1);
  }, [searchValue, config.searchFields]);

  const serviceQuery: ServiceQuery<TFilters> = React.useMemo(
    () => ({ page, perPage, sorting, filters }),
    [page, perPage, sorting, filters]
  );

  const queryKey = React.useMemo(() => {
    const base = config.queryKey ?? [tableId];
    return [...base, serviceQuery];
  }, [config.queryKey, tableId, serviceQuery]);

  const queryFn = React.useCallback(() => {
    if (!config.service?.getAll) {
      throw new Error('DataTable requires config.service.getAll(query)');
    }
    return config.service.getAll({ ...serviceQuery });
  }, [config.service, serviceQuery]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ServiceResult<TRecord>, Error>({
    queryKey,
    queryFn,
    placeholderData: (prev) => prev,
    staleTime: config.staleTime ?? 10_000,
    gcTime: config.gcTime ?? 5 * 60_000,
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? false,
  });

  const tableData = data?.data ?? [];

  const actionsContext = React.useMemo<DataTableActionsContext<TRecord, TFilters>>(() => {
    return {
      refetch,
      isFetching,
      page,
      perPage,
      sorting,
      filters,
      rows: tableData,
      meta: data?.meta,
      setPage,
      setPerPage,
      setSorting,
      setFilters,
      setSearchValue,
      applyFilters: (nextFilters: MergedTableFilters<TFilters>) => {
        setFilters(nextFilters || ({} as MergedTableFilters<TFilters>));
        setPage(1);
      },
      resetFilters: () => {
        setFilters({} as MergedTableFilters<TFilters>);
        setSearchValue('');
        setPage(1);
      },
      refresh: () => refetch(),
    };
  }, [refetch, isFetching, page, perPage, sorting, filters, tableData, data?.meta]);

  const registryMap = React.useMemo(() => {
    const map: Record<string, ModalRegistryHandler<TRecord, TFilters>> = {};
    (config.actions || []).forEach((a) => {
      if (a?.openModal) {
        const openModal = a.openModal;
        map[`${tableId}:action:${a.id}`] = async ({ context }) => {
          const payload = await Promise.resolve(openModal({ context }));
          if (isModalPayload(payload) && config.onOpenModal) {
            config.onOpenModal(payload.type, { ...(payload.props ?? {}), context });
          }
        };
      }
    });
    (config.rowActions || []).forEach((a) => {
      if (a?.openModal) {
        const openModal = a.openModal;
        map[`${tableId}:rowAction:${a.id}`] = async (args) => {
          if (!('record' in args)) return;
          const { context, record } = args;
          const payload = await Promise.resolve(openModal({ record, context }));
          if (isModalPayload(payload) && config.onOpenModal) {
            config.onOpenModal(payload.type, { ...(payload.props ?? {}), context, record });
          }
        };
      }
    });
    return map;
  }, [config.actions, config.rowActions, tableId, config.onOpenModal]);

  React.useEffect(() => {
    if (config.onRegisterModal) {
      config.onRegisterModal(registryMap);
    }
  }, [registryMap, config.onRegisterModal]);

  React.useEffect(() => {
    if (config.onUrlAction) {
      config.onUrlAction({ config, context: actionsContext });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = data?.meta;
  const totalPages = React.useMemo(() => {
    if (meta?.total == null) return null;
    const ep = meta?.perPage || perPage;
    return Math.max(1, Math.ceil(meta.total / (ep || 1)));
  }, [meta?.total, meta?.perPage, perPage]);

  React.useEffect(() => {
    if (!totalPages) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const columns = React.useMemo((): ColumnDef<TRecord>[] => {
    return (config.columns || []).map((col) => {
      const { sortable, ...rest } = col;
      const colCopy: ColumnDef<TRecord> = { ...rest };
      if (sortable === false) {
        colCopy.enableSorting = false;
      }
      if (sortable === true && colCopy.enableSorting === undefined) {
        colCopy.enableSorting = true;
      }
      return colCopy;
    });
  }, [config.columns]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: false,
    pageCount: totalPages ?? undefined,
    meta: { isLoading, isFetching, isError },
  });

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();
  const rows = rowModel.rows;

  const skeletonRows = config.skeletonRows ?? 3;
  const colsCount = columns.length;
  const busy = isLoading || isFetching;

  const c = React.useMemo(() => mergeDataTableClassNames(config.classNames), [config.classNames]);
  const labels = React.useMemo(() => mergeDataTableLabels(config.labels), [config.labels]);
  const LC = config.layoutComponents;

  const hasHeaderBlock = Boolean(config.pageHeader || (config.actions && config.actions.length > 0));
  const actionsBar =
    config.actions && config.actions.length > 0 ? (
      <ActionButtonsBar
        actions={config.actions}
        context={actionsContext}
        onOpenModal={config.onOpenModal}
      />
    ) : null;
  const actionsWrapped = actionsBar ? <div className={joinClasses(c.actionsWrapper)}>{actionsBar}</div> : null;

  const defaultHeaderInner = (
    <>
      {config.pageHeader && (
        <div className={joinClasses(c.pageHeaderWrapper)}>
          {config.pageHeader.title && <h2 className={joinClasses(c.pageTitle)}>{config.pageHeader.title}</h2>}
          {config.pageHeader.subtitle && <p className={joinClasses(c.pageSubtitle)}>{config.pageHeader.subtitle}</p>}
        </div>
      )}
      {actionsWrapped}
    </>
  );

  const headerSection =
    hasHeaderBlock &&
    (LC?.PageHeader ? (
      <LC.PageHeader
        title={config.pageHeader?.title}
        subtitle={config.pageHeader?.subtitle}
        rightSlot={actionsBar ?? undefined}
        classNames={{
          headerCard: c.headerCard,
          pageHeaderWrapper: c.pageHeaderWrapper,
          pageTitle: c.pageTitle,
          pageSubtitle: c.pageSubtitle,
          actionsWrapper: c.actionsWrapper,
        }}
      />
    ) : (
      <div className={joinClasses(c.headerCard)}>{defaultHeaderInner}</div>
    ));

  const filtersEl =
    typeof config.renderFilters === 'function' ? (
      config.renderFilters(actionsContext)
    ) : config.filtersUI != null ? (
      <InlineFiltersUI context={actionsContext} filtersUI={config.filtersUI} />
    ) : null;

  const searchEl =
    config.searchFields && config.searchFields.length > 0 ? (
      <div className={joinClasses(c.searchWrapper)}>
        <SearchInput
          searchFields={config.searchFields}
          value={searchValue}
          onChange={setSearchValue}
          className={joinClasses(c.searchInput)}
        />
      </div>
    ) : null;

  const toolbarInner = (
    <>
      {filtersEl}
      {searchEl}
    </>
  );

  const toolbarSection =
    (filtersEl || searchEl) &&
    (LC?.Toolbar ? (
      <LC.Toolbar classNames={{ filtersAndSearchRow: c.filtersAndSearchRow }}>{toolbarInner}</LC.Toolbar>
    ) : (
      <div className={joinClasses(c.filtersAndSearchRow)}>{toolbarInner}</div>
    ));

  const tableInner = (
    <div className={joinClasses(c.tableScroll)}>
      <Table className={joinClasses(c.table)}>
        <TableHeader className={joinClasses(c.tableHeader)}>
          {headerGroups.map((headerGroup) => (
            <TableRow key={headerGroup.id} className={joinClasses(c.tableRow)}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    className={joinClasses(c.tableHeadCell, canSort ? c.tableHeadCellSortable : '')}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort && (
                      <span>
                        {header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                      </span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className={joinClasses(c.tableBody)}>
          {busy ? (
            Array.from({ length: skeletonRows }).map((_, idx) => (
              <TableRow key={idx} className={joinClasses(c.tableRow, c.skeletonRow)}>
                {Array.from({ length: colsCount }).map((__, colIdx) => (
                  <TableCell key={colIdx} className={joinClasses(c.tableCell)}>
                    <div className={joinClasses(c.skeletonBar)} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className={joinClasses(c.tableRow)}>
              <TableCell className={joinClasses(c.tableCell, c.messageCell)} colSpan={colsCount}>
                {labels.errorLoading}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className={joinClasses(c.tableRow)}>
              <TableCell className={joinClasses(c.tableCell, c.messageCell)} colSpan={colsCount}>
                {labels.noResults}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className={joinClasses(c.tableRow)}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={joinClasses(c.tableCell)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const tableSection = LC?.TableShell ? (
    <LC.TableShell classNames={{ tableOuter: c.tableOuter, tableScroll: c.tableScroll }}>{tableInner}</LC.TableShell>
  ) : (
    <div className={joinClasses(c.tableOuter)}>{tableInner}</div>
  );

  const showPagination = totalPages != null && totalPages > 1;

  return (
    <div className={joinClasses(c.root)}>
      {headerSection}
      {toolbarSection}
      {tableSection}
      {showPagination && (
        <div className={joinClasses(c.pagination)}>
          <div className={joinClasses(c.paginationInfo)}>
            <p>
              {labels.pageLabel} {page}
              {totalPages ? ` ${labels.ofLabel} ${totalPages}` : ''}
              {data?.meta?.total != null && (
                <span className={joinClasses(c.paginationMeta)}>
                  {` (${data.meta.total} ${labels.itemsLabel})`}
                </span>
              )}
            </p>
          </div>
          <div className={joinClasses(c.paginationButtons)}>
            <button
              type="button"
              className={joinClasses(c.paginationButton)}
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {labels.prev}
            </button>
            <button
              type="button"
              className={joinClasses(c.paginationButton)}
              disabled={page === totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages!, p + 1))}
            >
              {labels.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
