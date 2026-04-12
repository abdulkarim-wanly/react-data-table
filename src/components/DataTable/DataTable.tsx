import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  OnAfterMutationSuccessArgs,
  OpenModalCallback,
  ServiceQuery,
  ServiceResult,
} from "../../tableTypes";
import {
  mergeDataTableClassNames,
  mergeDataTableLabels,
  type DataTableClassNames,
  type DataTableLabels,
  type DataTableLayoutComponents,
} from "../../dataTableLayout";
import { useViewMode } from "../../hooks/useViewMode";
import { usePagination } from "../../hooks/usePagination";
import { useModalRegistry } from "../../hooks/useModalRegistry";

export type { ServiceQuery, ServiceResult } from "../../tableTypes";

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ").trim();
}

function getColumnMinWidthStyle(
  meta: unknown
): React.CSSProperties | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const mw = (meta as { minWidth?: number | string }).minWidth;
  if (mw == null || mw === "") return undefined;
  return {
    minWidth: typeof mw === "number" ? `${mw}px` : String(mw),
  };
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

function getViewModeStorageKey(tableId: string, customKey?: string): string {
  return customKey || `genesis-react-data-table:${tableId}:view-mode`;
}

// ---------------------------------------------------------------------------
// Sort indicator icons (inline SVG — no extra dep required)
// ---------------------------------------------------------------------------

function SortAscIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle" }}
    >
      <path
        d="M6 2L10 8H2L6 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle" }}
    >
      <path
        d="M6 10L2 4H10L6 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SortNeutralIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle", opacity: 0.35 }}
    >
      <path d="M6 2L9 5.5H3L6 2Z" fill="currentColor" />
      <path d="M6 10L3 6.5H9L6 10Z" fill="currentColor" />
    </svg>
  );
}

function SortIndicator({ direction }: { direction: "asc" | "desc" | false }) {
  if (direction === "asc") return <SortAscIcon />;
  if (direction === "desc") return <SortDescIcon />;
  return <SortNeutralIcon />;
}

// ---------------------------------------------------------------------------
// Public config/props types
// ---------------------------------------------------------------------------

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
   * Runs after {@link DataTableActionsContext.refreshAfterMutation} refetches the table query.
   * Use for app-specific follow-up (e.g. `queryClient.invalidateQueries`) without coupling this
   * library to your domain. Call `context.refreshAfterMutation()` from modals / mutation handlers.
   */
  onAfterMutationSuccess?: (
    args: OnAfterMutationSuccessArgs<TRecord>
  ) => void | Promise<void>;
  /**
   * Callback that receives a registry map of modal ids to handlers. Use this
   * function to integrate your application's modal system. The keys are of
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
   *
   * **Note:** this callback fires only on the initial mount and does not
   * re-run if `config.onUrlAction` changes reference between renders.
   * Capture any values you need inside the callback itself.
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
  modes?: DataTableViewMode[];
  defaultMode?: DataTableViewMode;
  /** Persist the user's last chosen mode in localStorage. Defaults to `true`. */
  persistMode?: boolean;
  storageKey?: string;
  renderGridItem?: (
    args: DataTableViewRendererArgs<TRecord, TFilters>
  ) => React.ReactNode;
  renderListItem?: (
    args: DataTableViewRendererArgs<TRecord, TFilters>
  ) => React.ReactNode;
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
 * modal integration, and provides search functionality.
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

  // ---- State ---------------------------------------------------------------
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(config.defaultPerPage ?? 10);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filters, setFilters] = React.useState<MergedTableFilters<TFilters>>(
    () => ({} as MergedTableFilters<TFilters>)
  );
  const [searchValue, setSearchValue] = React.useState("");

  // ---- Custom hooks --------------------------------------------------------
  const [viewMode, setViewMode] = useViewMode(tableId, config.views);

  // ---- Sync defaultPerPage changes -----------------------------------------
  React.useEffect(() => {
    const next = config.defaultPerPage ?? 10;
    setPerPage((prev) => (prev === next ? prev : next));
  }, [config.defaultPerPage]);

  // ---- Search → filters ----------------------------------------------------
  React.useEffect(() => {
    const fields = config.searchFields || [];
    if (fields.length === 0) return;
    if (searchValue && searchValue.trim()) {
      setFilters((prev: MergedTableFilters<TFilters>) => ({
        ...prev,
        search: searchValue.trim(),
        searchFields: fields,
      }));
    } else {
      setFilters((prev: MergedTableFilters<TFilters>) => {
        const { search: _s, searchFields: _sf, ...rest } = prev;
        return rest as MergedTableFilters<TFilters>;
      });
    }
    setPage(1);
  }, [searchValue, config.searchFields]);

  // ---- Data fetching -------------------------------------------------------
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

  const queryClient = useQueryClient();

  const onAfterMutationSuccessRef = React.useRef(config.onAfterMutationSuccess);
  onAfterMutationSuccessRef.current = config.onAfterMutationSuccess;

  const refreshAfterMutation = React.useCallback(async () => {
    await refetch();
    const onExtra = onAfterMutationSuccessRef.current;
    if (typeof onExtra === "function") {
      await onExtra({ queryClient, refetch });
    }
  }, [refetch, queryClient]);

  const tableData = data?.data ?? [];

  // ---- View mode availability ----------------------------------------------
  const availableViewModes = React.useMemo(() => {
    const requested: DataTableViewMode[] = config.views?.modes?.length
      ? config.views.modes
      : ["table"];
    const nextModes: DataTableViewMode[] = [];
    requested.forEach((mode) => {
      if (nextModes.includes(mode)) return;
      if (mode === "table") { nextModes.push(mode); return; }
      if (mode === "grid" && typeof config.views?.renderGridItem === "function") {
        nextModes.push(mode); return;
      }
      if (mode === "list" && typeof config.views?.renderListItem === "function") {
        nextModes.push(mode); return;
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
    return nextModes.length > 0 ? nextModes : (["table"] as DataTableViewMode[]);
  }, [config.views]);

  const currentViewMode = availableViewModes.includes(viewMode)
    ? viewMode
    : availableViewModes[0];

  React.useEffect(() => {
    if (!availableViewModes.includes(viewMode)) {
      setViewMode(availableViewModes[0]);
    }
  }, [availableViewModes, viewMode, setViewMode]);

  // ---- Actions context -----------------------------------------------------
  const actionsContext = React.useMemo<
    DataTableActionsContext<TRecord, TFilters>
  >(
    () => ({
      refetch,
      refreshAfterMutation,
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
    }),
    [
      refetch,
      refreshAfterMutation,
      isFetching,
      page,
      perPage,
      currentViewMode,
      sorting,
      filters,
      tableData,
      data?.meta,
    ]
  );

  // ---- Modal registry (extracted hook) -------------------------------------
  useModalRegistry({
    tableId,
    actions: config.actions,
    rowActions: config.rowActions,
    onOpenModal: config.onOpenModal,
    onRegisterModal: config.onRegisterModal,
  });

  // ---- onUrlAction: stable ref so it only fires on mount ------------------
  const onUrlActionRef = React.useRef(config.onUrlAction);
  React.useEffect(() => {
    onUrlActionRef.current?.({ config, context: actionsContext });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Pagination ----------------------------------------------------------
  const { totalPages, totalCount, effectivePerPage, canGoPrev, canGoNext } =
    usePagination({
      page,
      setPage,
      perPage,
      meta: data?.meta,
      rowCount: tableData.length,
    });

  const showPagination = data !== undefined && !isError;
  const labels = React.useMemo(
    () => mergeDataTableLabels(config.labels),
    [config.labels]
  );

  // ---- Columns (with auto actions column) ----------------------------------
  const columns = React.useMemo((): ColumnDef<TRecord>[] => {
    const normalizedColumns = (config.columns || []).map((col) => {
      const { sortable, ...rest } = col;
      const colCopy: ColumnDef<TRecord> = { ...rest };
      if (sortable === false) colCopy.enableSorting = false;
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
  const rows = table.getRowModel().rows;

  const skeletonRows = config.skeletonRows ?? 3;
  const colsCount = columns.length;
  const busy = isLoading || isFetching;

  const c = React.useMemo(
    () => mergeDataTableClassNames(config.classNames),
    [config.classNames]
  );
  const LC = config.layoutComponents;

  // ---- Pagination summary --------------------------------------------------
  const paginationSummary = React.useMemo(() => {
    if (totalCount != null) {
      if (totalCount === 0) return labels.emptyDataset;
      const start = (page - 1) * effectivePerPage + 1;
      const end = Math.min(page * effectivePerPage, totalCount);
      return formatLabel(labels.showingRange, { start, end, total: totalCount });
    }
    return formatLabel(labels.rowsThisPage, { count: tableData.length });
  }, [totalCount, page, effectivePerPage, tableData.length, labels]);

  // ---- Layout pieces -------------------------------------------------------
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
      onRefresh={() => { void refetch(); }}
      isRefreshing={isFetching}
    />
  ) : null;

  const legacyToolbarVisible =
    !useChromeToolbar &&
    (filtersEl ||
      searchEl ||
      availableViewModes.length > 1 ||
      availableViewModes.includes("map"));

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

  // ---- Table body ----------------------------------------------------------
  const tableInner = (
    <div className={joinClasses(c.tableScroll)}>
      <Table className={joinClasses(c.table)}>
        <TableHeader className={joinClasses(c.tableHeader)}>
          {headerGroups.map((headerGroup) => (
            <TableRow key={headerGroup.id} className={joinClasses(c.tableRow)}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={joinClasses(
                      c.tableHeadCell,
                      canSort ? c.tableHeadCellSortable : ""
                    )}
                    style={getColumnMinWidthStyle(
                      header.column.columnDef.meta
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
                    {canSort && <SortIndicator direction={sortDir} />}
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
                  <TableCell
                    key={cell.id}
                    className={joinClasses(c.tableCell)}
                    style={getColumnMinWidthStyle(cell.column.columnDef.meta)}
                  >
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

  // ---- Grid / list / map collection renderer -------------------------------
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

  /**
   * Derive a stable record key from common id fields, falling back to index
   * only when the record has no detectable identifier. Using index alone
   * breaks React reconciliation when rows are reordered or filtered.
   */
  function getRecordKey(record: TRecord, index: number): string | number {
    const r = record as Record<string, unknown>;
    const id = r["id"] ?? r["_id"] ?? r["uuid"] ?? r["key"];
    return id != null ? String(id) : index;
  }

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
          <div className={joinClasses(c.messageCell)}>{labels.errorLoading}</div>
        ) : tableData.length === 0 ? (
          <div className={joinClasses(c.messageCell)}>{labels.noResults}</div>
        ) : (
          tableData.map((record, index) => (
            <div
              key={getRecordKey(record, index)}
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
      classNames={{ tableOuter: tableOuterToken, tableScroll: c.tableScroll }}
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
