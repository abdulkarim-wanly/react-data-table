import type { ReactNode } from 'react';

/**
 * Shared chrome toolbar icon control (refresh, view trigger, search toggle, expand shell).
 * Uses `bg-background` / `text-foreground` for shadcn-style themes; override via `classNames` if needed.
 */
const TOOLBAR_ICON_CONTROL =
  'inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-background/40 text-foreground shadow-sm outline-none transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50';

const TOOLBAR_ICON_CONTROL_MENU =
  `${TOOLBAR_ICON_CONTROL} data-[state=open]:border-white/20 data-[state=open]:bg-background/55`;

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
  /** View menu trigger for the built-in dropdown. */
  toolbarMenuButton: string;
  toolbarMenuLabel: string;
  toolbarMenuIcon: string;
  toolbarChevron: string;
  /** Built-in dropdown content panel. */
  toolbarDropdownMenuContent: string;
  toolbarDropdownMenuItem: string;
  toolbarDropdownMenuItemActive: string;
  /** Wraps search + hosted filters + reset in one row beside each other (chrome toolbar). */
  toolbarSearchFiltersCluster: string;
  /** Hosted `filtersUI` / `InlineFiltersUI` mount (next to search). */
  toolbarFiltersBeside: string;
  toolbarSearchWrap: string;
  toolbarRefreshButton: string;
  /** Extra classes for search input in the chrome toolbar (contrast on dark bar). */
  toolbarSearchInput: string;
  /** Row that animates max-width for chrome search (closed = icon, open = field). */
  toolbarSearchExpand: string;
  toolbarSearchExpandOpen: string;
  toolbarSearchExpandClosed: string;
  /** Icon-only chrome controls (search toggle, view menu, refresh). */
  toolbarIconButton: string;
  /** View mode dropdown trigger (`chromeToolbar`). Defaults match refresh-sized icon control. */
  toolbarButtonViewMode: string;
  /** Collapsed search: opens the search field. */
  toolbarButtonSearchOpen: string;
  /** Expanded search: left control that closes the field (visually joined to the input). */
  toolbarButtonSearchClose: string;
  /** Leading icon box inside each view mode dropdown row. */
  toolbarDropdownItemIconWrap: string;
  /** Appended to {@link toolbarDropdownItemIconWrap} for the active mode. */
  toolbarDropdownItemIconWrapActive: string;
}

export const DEFAULT_DATA_TABLE_CLASSNAMES: DataTableClassNames = {
  root: 'flex flex-col gap-4 w-full max-w-full overflow-x-auto',
  headerCard: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full',
  pageHeaderWrapper: '',
  pageTitle: '',
  pageSubtitle: '',
  actionsWrapper: '',
  filtersAndSearchRow: 'relative z-10 flex flex-col gap-3',
  viewModeToggle: 'flex items-center gap-2 flex-wrap',
  viewModeButton: '',
  viewModeButtonActive: '',
  searchWrapper: '',
  searchInput: 'max-w-md',
  tableOuter: 'relative z-0 isolate overflow-auto',
  tableScroll: '',
  /** `w-max` lets the table grow past the viewport when columns have min-widths, so `tableOuter` scrolls horizontally. */
  table: 'min-w-full w-max border-collapse',
  tableHeader: '',
  /** Default minimum column width for readable headers (override per column via `meta.minWidth`). */
  tableHeadCell: 'min-w-[8rem] align-top ltr:text-left! rtl:text-right!',
  tableHeadCellSortable: 'cursor-pointer select-none',
  tableBody: '',
  tableRow: '',
  tableCell: 'min-w-[8rem] align-top ltr:text-left! rtl:text-right!',
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
    'pointer-events-auto absolute -top-1 right-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-lg font-light text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-slate-900',
  mapSidebar: 'flex min-h-[420px] flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur',
  mapSidebarHeader: 'mb-3 flex items-center justify-between gap-3 text-sm font-medium text-slate-700',
  mapSidebarList: 'flex flex-1 flex-col gap-3 overflow-auto pr-1',
  mapCard:
    'cursor-pointer rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition',
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
  paginationButton: 'cursor-pointer disabled:cursor-not-allowed',
  tableBlock:
    'flex w-full max-w-full flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950',
  tableOuterChrome:
    'relative z-0 isolate max-h-[min(70vh,720px)] min-h-0 flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950',
  toolbarShell:
    'relative z-10 w-full shrink-0 border-b border-white/10 bg-background/30 text-foreground backdrop-blur',
  toolbarRow: 'flex flex-wrap items-center justify-between gap-3 px-3 py-2 md:px-4 md:py-3',
  toolbarLeft: 'flex min-w-0 flex-1 flex-wrap items-center gap-2',
  toolbarRight: 'flex shrink-0 flex-wrap items-center gap-2',
  /** Same footprint as {@link toolbarRefreshButton} (icon-only square). */
  toolbarMenuButton: TOOLBAR_ICON_CONTROL_MENU,
  toolbarMenuLabel: 'text-sm font-semibold text-foreground',
  toolbarMenuIcon: 'h-4 w-4 shrink-0 text-foreground/70',
  toolbarChevron:
    'h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-200 group-data-[state=open]:rotate-180',
  toolbarDropdownMenuContent:
    'min-w-40 rounded-xl border border-white/10 bg-background/95 p-1.5 text-foreground shadow-lg backdrop-blur',
  toolbarDropdownMenuItem:
    'gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground/90 outline-none data-[highlighted]:bg-background/40 data-[highlighted]:text-foreground',
  toolbarDropdownMenuItemActive: 'bg-background/30 font-medium text-foreground',
  toolbarSearchFiltersCluster:
    'flex min-w-0 flex-1 flex-wrap items-center gap-2',
  toolbarFiltersBeside:
    'shrink-0 min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[min(100%,38rem)] [&_input]:max-w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-white/10 [&_input]:bg-background/40 [&_input]:text-foreground [&_input]:shadow-sm [&_input]:placeholder:text-foreground/40 [&_select]:max-w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-white/10 [&_select]:bg-background/40 [&_select]:text-foreground [&_button]:rounded-xl',
  toolbarSearchWrap: 'min-w-0 w-full max-w-sm sm:w-auto sm:max-w-md',
  toolbarRefreshButton: TOOLBAR_ICON_CONTROL,
  toolbarSearchInput:
    '[&_input]:h-10 [&_input]:rounded-xl [&_input]:border [&_input]:border-white/10 [&_input]:bg-background/40 [&_input]:text-foreground [&_input]:shadow-sm [&_input]:placeholder:text-foreground/40 [&_button]:text-foreground/50 [&_button:hover]:text-foreground/80',
  toolbarSearchExpand:
    'flex h-11 shrink-0 items-center overflow-hidden rounded-xl border border-white/10 bg-background/40 shadow-sm transition-[max-width] duration-300 ease-out motion-reduce:transition-none',
  toolbarSearchExpandOpen: 'max-w-[min(100%,24rem)]',
  toolbarSearchExpandClosed: 'max-w-[2.75rem]',
  toolbarIconButton: TOOLBAR_ICON_CONTROL_MENU,
  toolbarButtonViewMode: `${TOOLBAR_ICON_CONTROL_MENU} group`,
  toolbarButtonSearchOpen: TOOLBAR_ICON_CONTROL,
  toolbarButtonSearchClose: `${TOOLBAR_ICON_CONTROL} rounded-r-none border-r-0 focus-visible:z-10`,
  toolbarDropdownItemIconWrap:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  toolbarDropdownItemIconWrapActive:
    'border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-200',
};

export function mergeDataTableClassNames(
  partial?: Partial<DataTableClassNames>
): DataTableClassNames {
  const merged: DataTableClassNames = {
    ...DEFAULT_DATA_TABLE_CLASSNAMES,
    ...partial,
  };
  const icon = partial?.toolbarIconButton;
  if (icon) {
    if (!partial?.toolbarButtonViewMode) {
      merged.toolbarButtonViewMode = /\bgroup\b/.test(icon)
        ? icon
        : `${icon} group`;
    }
    if (!partial?.toolbarButtonSearchOpen) {
      merged.toolbarButtonSearchOpen = icon;
    }
    if (!partial?.toolbarButtonSearchClose) {
      merged.toolbarButtonSearchClose = `${icon} rounded-r-none border-r-0 focus-visible:z-10`;
    }
    if (!partial?.toolbarRefreshButton) {
      merged.toolbarRefreshButton = icon;
    }
  }
  return merged;
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
  /** `aria-label` for collapsed chrome search (opens field). */
  toolbarSearchOpen: string;
  /** `aria-label` for expanded chrome search (collapses field). */
  toolbarSearchClose: string;
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
  toolbarSearchOpen: 'Open search',
  toolbarSearchClose: 'Close search',
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
