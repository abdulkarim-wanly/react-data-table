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
  pagination: string;
  paginationInfo: string;
  paginationMeta: string;
  paginationButtons: string;
  paginationButton: string;
}

export const DEFAULT_DATA_TABLE_CLASSNAMES: DataTableClassNames = {
  root: 'flex flex-col gap-4 w-full max-w-full overflow-x-auto',
  headerCard: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full',
  pageHeaderWrapper: '',
  pageTitle: '',
  pageSubtitle: '',
  actionsWrapper: '',
  filtersAndSearchRow: 'flex flex-col gap-3',
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
  pagination: 'flex items-center justify-between gap-3 text-sm mt-2',
  paginationInfo: '',
  paginationMeta: 'text-muted-foreground',
  paginationButtons: 'flex items-center gap-2',
  paginationButton: '',
};

export function mergeDataTableClassNames(
  partial?: Partial<DataTableClassNames>
): DataTableClassNames {
  return { ...DEFAULT_DATA_TABLE_CLASSNAMES, ...partial };
}

export interface DataTableLabels {
  errorLoading: string;
  noResults: string;
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
}

export const DEFAULT_DATA_TABLE_LABELS: DataTableLabels = {
  errorLoading: 'Error loading data',
  noResults: 'No results',
  pageLabel: 'Page',
  ofLabel: 'of',
  itemsLabel: 'items',
  showingRange: 'Showing {{start}}–{{end}} of {{total}}',
  rowsThisPage: '{{count}} on this page',
  emptyDataset: 'No items',
  prev: 'Previous',
  next: 'Next',
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
