import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  SortingState,
  flexRender,
} from "@tanstack/react-table";

import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { SearchInput } from "../SearchInput/SearchInput";
import { UserActionCell, RowAction } from "../UserActionCell/UserActionCell";
import {
  ActionButtonsBar,
  TableAction,
} from "../ActionButtonsBar/ActionButtonsBar";
import {
  InlineFiltersUI,
  type DataTableFiltersUISlot,
} from "../InlineFiltersUI/InlineFiltersUI";
import { MapView } from "../MapView/MapView";
import { DataTablePageHeader } from "../DataTablePageHeader/DataTablePageHeader";
import { DataTableToolbar } from "../DataTableToolbar/DataTableToolbar";
import type {
  DataTableActionsContext,
  DataTableColumnDef,
  DataTableMapViewConfig,
  DataTableViewMode,
  DataTableViewRendererArgs,
  FilterValues,
  MergedTableFilters,
  ModalRegistryHandler,
  OpenModalCallback,
  ServiceQuery,
  ServiceResult,
} from "../../tableTypes";
import { isModalPayload } from "../../tableTypes";
import {
  mergeDataTableClassNames,
  mergeDataTableLabels,
  type DataTableClassNames,
  type DataTableLabels,
  type DataTableLayoutComponents,
} from "../../dataTableLayout";

export type { ServiceQuery, ServiceResult } from "../../tableTypes";

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ").trim();
}

function formatLabel(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(vars[key] ?? "")
  );
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function getColumnHeaderText<TRecord>(
  column: ColumnDef<TRecord>
): string | null {
  const header = column.header;
  if (typeof header === "string" || typeof header === "number") {
    return String(header);
  }
  return null;
}

function hasObviousActionsColumn<TRecord>(
  columns: ColumnDef<TRecord>[],
  actionsLabel: string
): boolean {
  const labelToken = normalizeToken(actionsLabel);
  return columns.some((column) => {
    const id = typeof column.id === "string" ? normalizeToken(column.id) : null;
    const accessorKey =
      "accessorKey" in column && typeof column.accessorKey === "string"
        ? normalizeToken(column.accessorKey)
        : null;
    const headerText = getColumnHeaderText(column);
    const headerToken = headerText ? normalizeToken(headerText) : null;

    return (
      id === "action" ||
      id === "actions" ||
      accessorKey === "action" ||
      accessorKey === "actions" ||
      headerToken === "action" ||
      headerToken === "actions" ||
      headerToken === labelToken
    );
  });
}

function isDataTableViewMode(value: unknown): value is DataTableViewMode {
  return (
    value === "table" ||
    value === "grid" ||
    value === "list" ||
    value === "map"
  );
}

function getViewModeStorageKey(tableId: string, customKey?: string): string {
  return customKey || `genesis-react-data-table:${tableId}:view-mode`;
}

function readPersistedViewMode(
  tableId: string,
  views?: Pick<
    DataTableViewsConfig<never, FilterValues>,
    "persistMode" | "storageKey"
  >
): DataTableViewMode | null {
  if (
    views?.persistMode === false ||
    typeof globalThis === "undefined" ||
    !("localStorage" in globalThis)
  ) {
    return null;
  }
  try {
    const stored = globalThis.localStorage?.getItem(
      getViewModeStorageKey(tableId, views?.storageKey)
    );
    return isDataTableViewMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

// Configuration object accepted by the DataTable component. Many fields mirror
// the original component’s API but have been made optional or simplified. The
// service property is required.
//
// Use two type parameters so row data and filter shape flow through the table:
// `DataTableConfig<UserRow, UserFilters>` — filters should use optional fields.
export interface DataTableConfig<
  TRecord,
  TFilters extends FilterValues = FilterValues
> {
  id?: string;
  queryKey?: unknown[];
  service: {
    getAll: (query: ServiceQuery<TFilters>) => Promise<ServiceResult<TRecord>>;
  };
  columns: DataTableColumnDef<TRecord>[];
  rowActions?: RowAction<TRecord, TFilters>[];
  /** Set to `false` if you already render row actions in your own column definition. */
  autoRowActionsColumn?: boolean;
  defaultPerPage?: number;
  actions?: TableAction<TRecord, TFilters>[];
  views?: DataTableViewsConfig<TRecord, TFilters>;
  /**
   * Inline filters slot. When set and `renderFilters` is omitted, `DataTable` renders
   * {@link InlineFiltersUI} with this value (function, `{ render }`, or `{ Component, formConfig, onApply }`).
   */
  filtersUI?: DataTableFiltersUISlot<TRecord, TFilters>;
  /**
   * Optional override for the filters region. When set, it replaces the default
   * `InlineFiltersUI` branch (ignores `filtersUI` for that slot).
   */
  renderFilters?: (
    context: DataTableActionsContext<TRecord, TFilters>
  ) => React.ReactNode;
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
  onRegisterModal?: (
    registry: Record<string, ModalRegistryHandler<TRecord, TFilters>>
  ) => void;
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
  /**
   * When `true` (default), filters, search, column sort, view mode, and refresh use a dark chrome toolbar
   * above the table. When `false`, the previous light filters row and outline view toggle is used.
   */
  chromeToolbar?: boolean;
}

export interface DataTableViewsConfig<
  TRecord,
  TFilters extends FilterValues = FilterValues
> {
  /**
   * Enabled built-in view modes. `table` remains the fallback when this list is empty
   * or when a requested custom renderer is missing.
   */
  modes?: DataTableViewMode[];
  /** Initial view mode used on first render when it is also available. */
  defaultMode?: DataTableViewMode;
  /** Persist the user's last chosen mode in localStorage. Defaults to `true`. */
  persistMode?: boolean;
  /** Override the localStorage key used when `persistMode` is enabled. */
  storageKey?: string;
  /** Required if you enable the `grid` view mode. */
  renderGridItem?: (
    args: DataTableViewRendererArgs<TRecord, TFilters>
  ) => React.ReactNode;
  /** Required if you enable the `list` view mode. */
  renderListItem?: (
    args: DataTableViewRendererArgs<TRecord, TFilters>
  ) => React.ReactNode;
  /** Required if you enable the `map` view mode. */
  map?: DataTableMapViewConfig<TRecord, TFilters>;
}

export interface DataTableProps<
  TRecord,
  TFilters extends FilterValues = FilterValues
> {
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
export function DataTable<
  TRecord,
  TFilters extends FilterValues = FilterValues
>({ config }: DataTableProps<TRecord, TFilters>) {
  const tableId = config.id || "table";
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(config.defaultPerPage ?? 10);
  const [viewMode, setViewMode] = React.useState<DataTableViewMode>(
    () =>
      readPersistedViewMode(tableId, config.views) ??
      config.views?.defaultMode ??
      "table"
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filters, setFilters] = React.useState<MergedTableFilters<TFilters>>(
    () => ({} as MergedTableFilters<TFilters>)
  );
  const [searchValue, setSearchValue] = React.useState("");

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
      throw new Error("DataTable requires config.service.getAll(query)");
    }
    return config.service.getAll({ ...serviceQuery });
  }, [config.service, serviceQuery]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<
    ServiceResult<TRecord>,
    Error
  >({
    queryKey,
    queryFn,
    placeholderData: (prev) => prev,
    staleTime: config.staleTime ?? 10_000,
    gcTime: config.gcTime ?? 5 * 60_000,
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? false,
  });

  const tableData = data?.data ?? [];
  const availableViewModes = React.useMemo(() => {
    const requested: DataTableViewMode[] = config.views?.modes?.length
      ? config.views.modes
      : ["table"];
    const nextModes: DataTableViewMode[] = [];
    requested.forEach((mode) => {
      if (nextModes.includes(mode)) return;
      if (mode === "table") {
        nextModes.push(mode);
        return;
      }
      if (
        mode === "grid" &&
        typeof config.views?.renderGridItem === "function"
      ) {
        nextModes.push(mode);
        return;
      }
      if (
        mode === "list" &&
        typeof config.views?.renderListItem === "function"
      ) {
        nextModes.push(mode);
        return;
      }
      if (
        mode === "map" &&
        config.views?.map &&
        typeof config.views.map.getCoordinates === "function" &&
        typeof config.views.map.renderCard === "function"
      ) {
        nextModes.push(mode);
      }
    });
    return nextModes.length > 0
      ? nextModes
      : (["table"] as DataTableViewMode[]);
  }, [config.views]);
  const currentViewMode = availableViewModes.includes(viewMode)
    ? viewMode
    : availableViewModes[0];

  React.useEffect(() => {
    if (availableViewModes.includes(viewMode)) return;
    setViewMode(availableViewModes[0]);
  }, [availableViewModes, viewMode]);

  React.useEffect(() => {
    if (
      config.views?.persistMode === false ||
      typeof globalThis === "undefined" ||
      !("localStorage" in globalThis)
    ) {
      return;
    }
    try {
      globalThis.localStorage?.setItem(
        getViewModeStorageKey(tableId, config.views?.storageKey),
        currentViewMode
      );
    } catch {
      // Ignore storage write failures so rendering is never blocked by browser policy.
    }
  }, [
    config.views?.persistMode,
    config.views?.storageKey,
    tableId,
    currentViewMode,
  ]);

  const actionsContext = React.useMemo<
    DataTableActionsContext<TRecord, TFilters>
  >(() => {
    return {
      refetch,
      isFetching,
      page,
      perPage,
      viewMode: currentViewMode,
      sorting,
      filters,
      rows: tableData,
      meta: data?.meta,
      setPage,
      setPerPage,
      setViewMode,
      setSorting,
      setFilters,
      setSearchValue,
      applyFilters: (nextFilters: MergedTableFilters<TFilters>) => {
        setFilters(nextFilters || ({} as MergedTableFilters<TFilters>));
        setPage(1);
      },
      resetFilters: () => {
        setFilters({} as MergedTableFilters<TFilters>);
        setSearchValue("");
        setPage(1);
      },
      refresh: () => refetch(),
    };
  }, [
    refetch,
    isFetching,
    page,
    perPage,
    currentViewMode,
    sorting,
    filters,
    tableData,
    data?.meta,
  ]);

  const registryMap = React.useMemo(() => {
    const map: Record<string, ModalRegistryHandler<TRecord, TFilters>> = {};
    (config.actions || []).forEach((a) => {
      if (a?.openModal) {
        const openModal = a.openModal;
        map[`${tableId}:action:${a.id}`] = async ({ context }) => {
          const payload = await Promise.resolve(openModal({ context }));
          if (isModalPayload(payload) && config.onOpenModal) {
            config.onOpenModal(payload.type, {
              ...(payload.props ?? {}),
              context,
            });
          }
        };
      }
    });
    (config.rowActions || []).forEach((a) => {
      if (a?.openModal) {
        const openModal = a.openModal;
        map[`${tableId}:rowAction:${a.id}`] = async (args) => {
          if (!("record" in args)) return;
          const { context, record } = args;
          const payload = await Promise.resolve(openModal({ record, context }));
          if (isModalPayload(payload) && config.onOpenModal) {
            config.onOpenModal(payload.type, {
              ...(payload.props ?? {}),
              context,
              record,
            });
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
  const effectivePerPage = Math.max(1, meta?.perPage ?? perPage);
  const totalCount = meta?.total;

  const totalPages = React.useMemo(() => {
    if (totalCount == null || totalCount < 0) return null;
    return Math.max(1, Math.ceil(totalCount / effectivePerPage));
  }, [totalCount, effectivePerPage]);

  React.useEffect(() => {
    if (totalPages == null) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const rowCount = tableData.length;
  const canGoPrev =
    meta?.hasPrevious !== undefined ? meta.hasPrevious : page > 1;
  const canGoNext = React.useMemo(() => {
    if (meta?.hasNext !== undefined) return meta.hasNext;
    if (totalPages != null) return page < totalPages;
    if (page === 1 && rowCount === 0) return false;
    return rowCount >= effectivePerPage;
  }, [meta?.hasNext, totalPages, page, rowCount, effectivePerPage]);

  const showPagination = data !== undefined && !isError;
  const labels = React.useMemo(
    () => mergeDataTableLabels(config.labels),
    [config.labels]
  );

  const columns = React.useMemo((): ColumnDef<TRecord>[] => {
    const normalizedColumns = (config.columns || []).map((col) => {
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
    if (
      !config.rowActions ||
      config.rowActions.length === 0 ||
      config.autoRowActionsColumn === false ||
      hasObviousActionsColumn(normalizedColumns, labels.actionsColumn)
    ) {
      return normalizedColumns;
    }
    return [
      ...normalizedColumns,
      {
        id: `${tableId}__rowActions`,
        header: labels.actionsColumn,
        enableSorting: false,
        cell: ({ row }) => (
          <UserActionCell
            record={row.original}
            rowActions={config.rowActions!}
            context={actionsContext}
            onOpenModal={config.onOpenModal}
          />
        ),
      } satisfies ColumnDef<TRecord>,
    ];
  }, [
    config.columns,
    config.rowActions,
    config.autoRowActionsColumn,
    tableId,
    labels.actionsColumn,
    actionsContext,
    config.onOpenModal,
  ]);

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

  const c = React.useMemo(
    () => mergeDataTableClassNames(config.classNames),
    [config.classNames]
  );
  const LC = config.layoutComponents;

  const paginationSummary = React.useMemo(() => {
    if (totalCount != null) {
      if (totalCount === 0) return labels.emptyDataset;
      const start = (page - 1) * effectivePerPage + 1;
      const end = Math.min(page * effectivePerPage, totalCount);
      return formatLabel(labels.showingRange, {
        start,
        end,
        total: totalCount,
      });
    }
    return formatLabel(labels.rowsThisPage, { count: rowCount });
  }, [totalCount, page, effectivePerPage, rowCount, labels]);

  const hasHeaderBlock = Boolean(
    config.pageHeader || (config.actions && config.actions.length > 0)
  );
  const actionsBar =
    config.actions && config.actions.length > 0 ? (
      <ActionButtonsBar
        actions={config.actions}
        context={actionsContext}
        onOpenModal={config.onOpenModal}
      />
    ) : null;

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
      <DataTablePageHeader
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
    ));

  const filtersEl =
    typeof config.renderFilters === "function" ? (
      config.renderFilters(actionsContext)
    ) : config.filtersUI != null ? (
      <InlineFiltersUI context={actionsContext} filtersUI={config.filtersUI} />
    ) : null;

  const useChromeToolbar = config.chromeToolbar !== false;

  const searchEl =
    config.searchFields && config.searchFields.length > 0 ? (
      <div className={joinClasses(c.searchWrapper)}>
        <SearchInput
          searchFields={config.searchFields}
          value={searchValue}
          onChange={setSearchValue}
          hideLeadingIcon={useChromeToolbar}
          className={joinClasses(
            c.searchInput,
            useChromeToolbar ? c.toolbarSearchInput : ""
          )}
        />
      </div>
    ) : null;

  const toolbarInnerLegacy = (
    <>
      {filtersEl}
      {searchEl}
      {availableViewModes.length > 1 && (
        <div className={joinClasses(c.viewModeToggle)}>
          {availableViewModes.map((mode) => {
            const label =
              mode === "grid"
                ? labels.viewAsGrid
                : mode === "list"
                ? labels.viewAsList
                : mode === "map"
                ? labels.viewAsMap
                : labels.viewAsTable;
            return (
              <Button
                key={mode}
                type="button"
                variant="outline"
                className={joinClasses(
                  c.viewModeButton,
                  currentViewMode === mode ? c.viewModeButtonActive : ""
                )}
                aria-pressed={currentViewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      )}
    </>
  );

  const chromeToolbarEl = useChromeToolbar ? (
    <DataTableToolbar
      classNames={{
        toolbarShell: c.toolbarShell,
        toolbarRow: c.toolbarRow,
        toolbarLeft: c.toolbarLeft,
        toolbarRight: c.toolbarRight,
        toolbarMenuIcon: c.toolbarMenuIcon,
        toolbarDropdownMenuContent: c.toolbarDropdownMenuContent,
        toolbarDropdownMenuItem: c.toolbarDropdownMenuItem,
        toolbarDropdownMenuItemActive: c.toolbarDropdownMenuItemActive,
        toolbarDropdownItemIconWrap: c.toolbarDropdownItemIconWrap,
        toolbarDropdownItemIconWrapActive: c.toolbarDropdownItemIconWrapActive,
        toolbarSearchFiltersCluster: c.toolbarSearchFiltersCluster,
        toolbarFiltersBeside: c.toolbarFiltersBeside,
        toolbarSearchWrap: c.toolbarSearchWrap,
        toolbarRefreshButton: c.toolbarRefreshButton,
        toolbarSearchExpand: c.toolbarSearchExpand,
        toolbarSearchExpandOpen: c.toolbarSearchExpandOpen,
        toolbarSearchExpandClosed: c.toolbarSearchExpandClosed,
        toolbarButtonViewMode: c.toolbarButtonViewMode,
        toolbarButtonSearchOpen: c.toolbarButtonSearchOpen,
        toolbarButtonSearchClose: c.toolbarButtonSearchClose,
      }}
      labels={{
        toolbarView: labels.toolbarView,
        toolbarRefresh: labels.toolbarRefresh,
        toolbarSearchOpen: labels.toolbarSearchOpen,
        toolbarSearchClose: labels.toolbarSearchClose,
        viewAsTable: labels.viewAsTable,
        viewAsGrid: labels.viewAsGrid,
        viewAsList: labels.viewAsList,
        viewAsMap: labels.viewAsMap,
      }}
      filtersPanel={filtersEl}
      hasFilters={Boolean(filtersEl)}
      searchSlot={searchEl}
      searchHasValue={Boolean(searchValue?.trim())}
      viewModes={availableViewModes}
      currentViewMode={currentViewMode}
      onViewMode={setViewMode}
      onRefresh={() => {
        void refetch();
      }}
      isRefreshing={isFetching}
    />
  ) : null;

  const legacyToolbarVisible =
    !useChromeToolbar &&
    (filtersEl ||
      searchEl ||
      availableViewModes.length > 1 ||
      availableViewModes.includes('map'));

  const legacyToolbarSection =
    legacyToolbarVisible &&
    (LC?.Toolbar ? (
      <LC.Toolbar classNames={{ filtersAndSearchRow: c.filtersAndSearchRow }}>
        {toolbarInnerLegacy}
      </LC.Toolbar>
    ) : (
      <div className={joinClasses(c.filtersAndSearchRow)}>
        {toolbarInnerLegacy}
      </div>
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
                    className={joinClasses(
                      c.tableHeadCell,
                      canSort ? c.tableHeadCellSortable : ""
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {canSort && (
                      <span>
                        {header.column.getIsSorted() === "asc"
                          ? " 🔼"
                          : header.column.getIsSorted() === "desc"
                          ? " 🔽"
                          : ""}
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
              <TableRow
                key={idx}
                className={joinClasses(c.tableRow, c.skeletonRow)}
              >
                {Array.from({ length: colsCount }).map((__, colIdx) => (
                  <TableCell key={colIdx} className={joinClasses(c.tableCell)}>
                    <div className={joinClasses(c.skeletonBar)} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className={joinClasses(c.tableRow)}>
              <TableCell
                className={joinClasses(c.tableCell, c.messageCell)}
                colSpan={colsCount}
              >
                {labels.errorLoading}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className={joinClasses(c.tableRow)}>
              <TableCell
                className={joinClasses(c.tableCell, c.messageCell)}
                colSpan={colsCount}
              >
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

  const renderCollectionItem = React.useCallback(
    (record: TRecord, index: number) => {
      const args: DataTableViewRendererArgs<TRecord, TFilters> = {
        record,
        index,
        context: actionsContext,
        onOpenModal: config.onOpenModal,
      };
      if (currentViewMode === "grid" && config.views?.renderGridItem) {
        return config.views.renderGridItem(args);
      }
      if (currentViewMode === "list" && config.views?.renderListItem) {
        return config.views.renderListItem(args);
      }
      return null;
    },
    [actionsContext, config.onOpenModal, config.views, currentViewMode]
  );

  const collectionInner =
    currentViewMode === "table" ? (
      tableInner
    ) : currentViewMode === "map" && config.views?.map ? (
      <MapView
        records={tableData}
        context={actionsContext}
        config={config.views.map}
        classNames={{
          mapViewRoot: c.mapViewRoot,
          mapViewSplitGrid: c.mapViewSplitGrid,
          mapFloatingBar: c.mapFloatingBar,
          mapDetailPanel: c.mapDetailPanel,
          mapDetailClose: c.mapDetailClose,
          mapSidebar: c.mapSidebar,
          mapSidebarHeader: c.mapSidebarHeader,
          mapSidebarList: c.mapSidebarList,
          mapCard: c.mapCard,
          mapCardActive: c.mapCardActive,
          mapCanvasShell: c.mapCanvasShell,
          mapCanvas: c.mapCanvas,
          mapEmptyState: c.mapEmptyState,
          mapPopup: c.mapPopup,
        }}
        labels={{
          mapResults: labels.mapResults,
          mapNoCoordinates: labels.mapNoCoordinates,
          errorLoading: labels.errorLoading,
        }}
        isBusy={busy}
        isError={isError}
        skeletonRows={skeletonRows}
        onOpenModal={config.onOpenModal}
      />
    ) : (
      <div
        className={joinClasses(
          c.tableScroll,
          currentViewMode === "grid" ? c.gridView : c.listView
        )}
      >
        {busy ? (
          Array.from({ length: skeletonRows }).map((_, idx) => (
            <div
              key={idx}
              className={joinClasses(
                currentViewMode === "grid" ? c.gridItem : c.listItem,
                c.skeletonRow
              )}
            >
              <div className={joinClasses(c.skeletonBar)} />
            </div>
          ))
        ) : isError ? (
          <div className={joinClasses(c.messageCell)}>
            {labels.errorLoading}
          </div>
        ) : tableData.length === 0 ? (
          <div className={joinClasses(c.messageCell)}>{labels.noResults}</div>
        ) : (
          tableData.map((record, index) => (
            <div
              key={index}
              className={joinClasses(
                currentViewMode === "grid" ? c.gridItem : c.listItem
              )}
            >
              {renderCollectionItem(record, index)}
            </div>
          ))
        )}
      </div>
    );

  const tableOuterToken = useChromeToolbar ? c.tableOuterChrome : c.tableOuter;

  const tableSection = LC?.TableShell ? (
    <LC.TableShell
      classNames={{
        tableOuter: tableOuterToken,
        tableScroll: c.tableScroll,
      }}
    >
      {collectionInner}
    </LC.TableShell>
  ) : (
    <div className={joinClasses(tableOuterToken)}>{collectionInner}</div>
  );

  const chromeStack =
    useChromeToolbar &&
    (LC?.Toolbar ? (
      <LC.Toolbar
        classNames={{
          filtersAndSearchRow: joinClasses(c.tableBlock, "flex flex-col gap-0"),
        }}
      >
        {chromeToolbarEl}
        {tableSection}
      </LC.Toolbar>
    ) : (
      <div className={joinClasses(c.tableBlock, "flex flex-col gap-0")}>
        {chromeToolbarEl}
        {tableSection}
      </div>
    ));

  const classicStack = !useChromeToolbar && (
    <>
      {legacyToolbarSection}
      {tableSection}
    </>
  );

  return (
    <div className={joinClasses(c.root)}>
      {headerSection}
      {chromeStack || classicStack}
      {showPagination && (
        <div className={joinClasses(c.pagination)}>
          <div className={joinClasses(c.paginationInfo)}>
            <p>
              {labels.pageLabel} {page}
              {totalPages != null && (
                <>
                  {" "}
                  {labels.ofLabel} {totalPages}
                </>
              )}
              {paginationSummary != null && paginationSummary !== "" && (
                <span
                  className={joinClasses(c.paginationMeta)}
                >{` · ${paginationSummary}`}</span>
              )}
            </p>
          </div>
          <div className={joinClasses(c.paginationButtons)}>
            <button
              type="button"
              className={joinClasses(c.paginationButton)}
              disabled={!canGoPrev || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {labels.prev}
            </button>
            <button
              type="button"
              className={joinClasses(c.paginationButton)}
              disabled={!canGoNext || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {labels.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
