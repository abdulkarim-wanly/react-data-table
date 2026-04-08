import type { ReactNode } from 'react';

/**
 * Tailwind (or any) classes for each layout region. Override only the keys you need;
 * omitted keys keep {@link DEFAULT_DATA_TABLE_CLASSNAMES}.
 */
export interface DataTableClassNames {
  /** Outermost wrapper */
  root: string;
  /** Row/card that contains title, subtitle, and actions */
  headerCard: string;
  /** Wraps title + subtitle block */
  pageHeaderWrapper: string;
  pageTitle: string;
  pageSubtitle: string;
  /** Wraps {@link ActionButtonsBar} */
  actionsWrapper: string;
  /** Wraps inline filters + search row */
  filtersAndSearchRow: string;
  /** Wraps the built-in view mode toggle buttons */
  viewModeToggle: string;
  /** Shared class for each built-in view mode button */
  viewModeButton: string;
  /** Added to the active built-in view mode button */
  viewModeButtonActive: string;
  /** Extra wrapper around {@link SearchInput} */
  searchWrapper: string;
  /** Passed to SearchInput `className` (width, flex, etc.) */
  searchInput: string;
  /** Scroll/card wrapper around the `<table>` */
  tableOuter: string;
  /** Inner scroll area (fixed height projects often set `max-h-[410px] overflow-auto`) */
  tableScroll: string;
  table: string;
  tableHeader: string;
  tableHeadCell: string;
  /** Added when column is sortable (merged with tableHeadCell) */
  tableHeadCellSortable: string;
  tableBody: string;
  tableRow: string;
  tableCell: string;
  skeletonRow: string;
  skeletonBar: string;
  messageCell: string;
  /** Wrapper for card-like grid items */
  gridView: string;
  /** Wrapper around a single grid item renderer */
  gridItem: string;
  /** Wrapper for stacked list items */
  listView: string;
  /** Wrapper around a single list item renderer */
  listItem: string;
  /** Base wrapper for the map view (`layout: 'full'` or split grid root) */
  mapViewRoot: string;
  /** Appended to `mapViewRoot` when `views.map.layout === 'split'` */
  mapViewSplitGrid: string;
  /** Top overlay on full-layout map (title + count) */
  mapFloatingBar: string;
  /** Detail sheet wrapper (full layout, marker selection) */
  mapDetailPanel: string;
  /** Close control for the detail sheet */
  mapDetailClose: string;
  /** Left-hand results/sidebar panel in map view */
  mapSidebar: string;
  /** Optional title row above map view result cards */
  mapSidebarHeader: string;
  /** Scrollable list of map cards */
  mapSidebarList: string;
  /** Wrapper around a single map card */
  mapCard: string;
  /** Added to the active map card */
  mapCardActive: string;
  /** Shell around the interactive map canvas */
  mapCanvasShell: string;
  /** Actual map canvas div mounted by Leaflet */
  mapCanvas: string;
  /** Empty/error state wrapper used by map view */
  mapEmptyState: string;
  /** Class applied to rendered popup content */
  mapPopup: string;
  pagination: string;
  paginationInfo: string;
  paginationMeta: string;
  paginationButtons: string;
  paginationButton: string;
  /** Rounded shell wrapping chrome toolbar + table (`chromeToolbar` mode). */
  tableBlock: string;
  /** Table scroll outer when stacked below chrome toolbar (no top radius). */
  tableOuterChrome: string;
  /** Dark toolbar shell (rounded top when inside {@link tableBlock}). */
  toolbarShell: string;
  toolbarRow: string;
  toolbarLeft: string;
  toolbarRight: string;
  /** `position: relative` wrapper for each menu trigger + dropdown. */
  toolbarMenuWrap: string;
  toolbarMenuButton: string;
  /** Added when a menu trigger panel is open. */
  toolbarMenuButtonOpen: string;
  toolbarMenuLabel: string;
  toolbarMenuIcon: string;
  toolbarChevron: string;
  toolbarDropdown: string;
  toolbarDropdownAlignEnd: string;
  toolbarDropdownItem: string;
  toolbarDropdownItemActive: string;
  /** Modal overlay (fixed, full screen) for the filters dialog. */
  toolbarFiltersDialogOverlay: string;
  /** Centered panel card. */
  toolbarFiltersDialogPanel: string;
  toolbarFiltersDialogHeader: string;
  toolbarFiltersDialogTitle: string;
  /** Scrollable filters form area. */
  toolbarFiltersDialogBody: string;
  toolbarFiltersDialogFooter: string;
  toolbarFiltersDialogResetButton: string;
  toolbarFiltersDialogDoneButton: string;
  toolbarSearchWrap: string;
  toolbarRefreshButton: string;
  /** Extra classes for search input in the chrome toolbar (contrast on dark bar). */
  toolbarSearchInput: string;
}

export const DEFAULT_DATA_TABLE_CLASSNAMES: DataTableClassNames = {
  root: 'flex flex-col gap-4 w-full max-w-full overflow-x-auto',
  headerCard: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full',
  pageHeaderWrapper: '',
  pageTitle: '',
  pageSubtitle: '',
  actionsWrapper: '',
  filtersAndSearchRow: 'flex flex-col gap-3',
  viewModeToggle: 'flex items-center gap-2 flex-wrap',
  viewModeButton: '',
  viewModeButtonActive: '',
  searchWrapper: '',
  searchInput: 'max-w-md',
  tableOuter: 'overflow-auto',
  tableScroll: '',
  table: 'min-w-full border-collapse',
  tableHeader: '',
  tableHeadCell: '',
  tableHeadCellSortable: 'cursor-pointer select-none',
  tableBody: '',
  tableRow: '',
  tableCell: '',
  skeletonRow: '',
  skeletonBar: 'h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse',
  messageCell: '',
  gridView: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  gridItem: '',
  listView: 'flex flex-col gap-3',
  listItem: '',
  mapViewRoot: 'relative w-full',
  mapViewSplitGrid: 'grid gap-4 xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]',
  mapFloatingBar:
    'absolute left-4 top-4 z-[1000] flex max-w-[min(100%,20rem)] items-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg backdrop-blur-sm',
  mapDetailPanel:
    'pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center px-4 pb-6 pt-16 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent',
  mapDetailClose:
    'pointer-events-auto absolute -top-1 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-lg font-light text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-slate-900',
  mapSidebar: 'flex min-h-[420px] flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur',
  mapSidebarHeader: 'mb-3 flex items-center justify-between gap-3 text-sm font-medium text-slate-700',
  mapSidebarList: 'flex flex-1 flex-col gap-3 overflow-auto pr-1',
  mapCard: 'rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition',
  mapCardActive: 'border-blue-400 bg-blue-50/70 ring-2 ring-blue-200',
  mapCanvasShell:
    'relative min-h-[min(72vh,720px)] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 shadow-sm',
  mapCanvas: 'h-[min(72vh,720px)] min-h-[420px] w-full',
  mapEmptyState: 'flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500',
  mapPopup: 'min-w-[220px] max-w-[min(100vw-2rem,28rem)]',
  pagination: 'flex items-center justify-between gap-3 text-sm mt-2',
  paginationInfo: '',
  paginationMeta: 'text-muted-foreground',
  paginationButtons: 'flex items-center gap-2',
  paginationButton: '',
  tableBlock:
    'flex w-full max-w-full flex-col overflow-hidden rounded-2xl border border-neutral-800/90 bg-neutral-950/5 shadow-md dark:border-neutral-700/90',
  tableOuterChrome: 'max-h-[min(70vh,720px)] min-h-0 flex-1 overflow-auto bg-white dark:bg-neutral-950',
  toolbarShell: 'w-full shrink-0 border-b border-white/10 bg-gradient-to-b from-neutral-800/98 to-neutral-900/95 text-neutral-100',
  toolbarRow: 'flex flex-wrap items-center justify-between gap-3 px-4 py-3',
  toolbarLeft: 'flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3',
  toolbarRight: 'flex shrink-0 flex-wrap items-center gap-2 sm:gap-3',
  toolbarMenuWrap: 'relative',
  toolbarMenuButton:
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 transition hover:bg-white/10',
  toolbarMenuButtonOpen: 'bg-white/10 ring-1 ring-white/20',
  toolbarMenuLabel: '',
  toolbarMenuIcon: 'h-4 w-4 shrink-0 opacity-90',
  toolbarChevron: 'h-4 w-4 shrink-0 opacity-70',
  toolbarDropdown:
    'absolute left-0 top-full z-[200] mt-1.5 min-w-[12rem] max-w-[min(100vw-2rem,20rem)] max-h-[min(60vh,22rem)] overflow-y-auto rounded-xl border border-neutral-600/90 bg-neutral-900 py-1.5 shadow-2xl ring-1 ring-black/30',
  toolbarDropdownAlignEnd: 'left-auto right-0 origin-top-right',
  toolbarDropdownItem:
    'flex w-full items-center px-3 py-2.5 text-left text-sm text-neutral-100 transition hover:bg-white/10',
  toolbarDropdownItemActive: 'bg-white/15 font-medium text-white',
  toolbarFiltersDialogOverlay:
    'fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]',
  toolbarFiltersDialogPanel:
    'flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950',
  toolbarFiltersDialogHeader:
    'border-b border-neutral-200 px-4 py-3 dark:border-neutral-800',
  toolbarFiltersDialogTitle: 'text-base font-semibold text-neutral-900 dark:text-neutral-100',
  toolbarFiltersDialogBody: 'min-h-0 flex-1 overflow-y-auto px-4 py-4',
  toolbarFiltersDialogFooter:
    'flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800',
  toolbarFiltersDialogResetButton:
    'rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800',
  toolbarFiltersDialogDoneButton:
    'rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white',
  toolbarSearchWrap: 'min-w-0 flex-1 max-w-md',
  toolbarRefreshButton:
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 transition hover:bg-white/10 disabled:opacity-50',
  toolbarSearchInput:
    '[&_input]:border-neutral-300/80 [&_input]:bg-white/95 [&_input]:text-neutral-900 dark:[&_input]:border-neutral-600 [&_input]:placeholder:text-neutral-500',
};

export function mergeDataTableClassNames(
  partial?: Partial<DataTableClassNames>
): DataTableClassNames {
  return { ...DEFAULT_DATA_TABLE_CLASSNAMES, ...partial };
}

export interface DataTableLabels {
  errorLoading: string;
  noResults: string;
  /** Header text for the built-in row actions column. */
  actionsColumn: string;
  viewAsTable: string;
  viewAsGrid: string;
  viewAsList: string;
  viewAsMap: string;
  mapResults: string;
  mapNoCoordinates: string;
  /** Accessible label for the detail sheet close control (full layout) */
  mapCloseDetail: string;
  pageLabel: string;
  ofLabel: string;
  itemsLabel: string;
  /** `{{start}}`, `{{end}}`, `{{total}}` — shown when `meta.total` is set and greater than zero */
  showingRange: string;
  /** `{{count}}` — rows on the current page when `meta.total` is not available */
  rowsThisPage: string;
  /** Shown when `meta.total === 0` */
  emptyDataset: string;
  prev: string;
  next: string;
  toolbarFilters: string;
  toolbarSort: string;
  toolbarView: string;
  toolbarRefresh: string;
  toolbarSortClear: string;
  /** Heading in the filters dialog. */
  toolbarFiltersDialogTitleLabel: string;
  /** Clears filters and search via table `resetFilters`. */
  toolbarResetFilters: string;
  /** Closes the filters dialog. */
  toolbarFiltersDone: string;
}

export const DEFAULT_DATA_TABLE_LABELS: DataTableLabels = {
  errorLoading: 'Error loading data',
  noResults: 'No results',
  actionsColumn: 'Actions',
  viewAsTable: 'Table',
  viewAsGrid: 'Grid',
  viewAsList: 'List',
  viewAsMap: 'Map',
  mapResults: 'Locations',
  mapNoCoordinates: 'No items with valid map coordinates were found on this page.',
  mapCloseDetail: 'Close details',
  pageLabel: 'Page',
  ofLabel: 'of',
  itemsLabel: 'items',
  showingRange: 'Showing {{start}}–{{end}} of {{total}}',
  rowsThisPage: '{{count}} on this page',
  emptyDataset: 'No items',
  prev: 'Previous',
  next: 'Next',
  toolbarFilters: 'Filters',
  toolbarSort: 'Sort',
  toolbarView: 'View',
  toolbarRefresh: 'Refresh',
  toolbarSortClear: 'Clear sort',
  toolbarFiltersDialogTitleLabel: 'Filters',
  toolbarResetFilters: 'Reset filters',
  toolbarFiltersDone: 'Done',
};

export function mergeDataTableLabels(partial?: Partial<DataTableLabels>): DataTableLabels {
  return { ...DEFAULT_DATA_TABLE_LABELS, ...partial };
}

/** Optional `PageHeader` receives merged class name tokens for the header card. */
export interface DataTablePageHeaderSlotProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
  classNames: Pick<
    DataTableClassNames,
    'headerCard' | 'pageHeaderWrapper' | 'pageTitle' | 'pageSubtitle' | 'actionsWrapper'
  >;
}

/** Optional wrapper around filters + search (e.g. flex row, glass panel). */
export interface DataTableToolbarSlotProps {
  children: ReactNode;
  classNames: Pick<DataTableClassNames, 'filtersAndSearchRow'>;
}

/** Optional shell around the scroll region + table (e.g. glass, rounded-2xl). */
export interface DataTableTableShellSlotProps {
  children: ReactNode;
  classNames: Pick<DataTableClassNames, 'tableOuter' | 'tableScroll'>;
}

export interface DataTableLayoutComponents {
  PageHeader?: React.ComponentType<DataTablePageHeaderSlotProps>;
  Toolbar?: React.ComponentType<DataTableToolbarSlotProps>;
  TableShell?: React.ComponentType<DataTableTableShellSlotProps>;
}
