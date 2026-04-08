import type { Dispatch, SetStateAction, ComponentType, ReactNode } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

/** Base shape for custom filter fields (use optional keys). */
export type FilterValues = Record<string, unknown>;

/**
 * Keys the table may add when `searchFields` is configured.
 * @see MergedTableFilters
 */
export type DataTableSearchFilterKeys = {
  search?: string;
  searchFields?: string[];
};

/** Consumer filters plus optional built-in search fields. */
export type MergedTableFilters<TFilters extends FilterValues> = TFilters & DataTableSearchFilterKeys;

/** Pagination metadata returned by `service.getAll`. */
export interface DataTableQueryMeta {
  /**
   * Total items across all pages. When set, the footer shows “page X of Y” and a range summary.
   * Omit for cursor-style APIs and set {@link hasNext} / {@link hasPrevious} instead.
   */
  total?: number;
  /** Optional echo of the current page from the server. */
  page?: number;
  /** Optional echo of page size from the server. */
  perPage?: number;
  /**
   * First-row offset / index for this page (meaning is API-specific). Passed through on
   * {@link DataTableActionsContext.meta}; the table does not interpret it unless you use it in actions.
   */
  start?: number;
  /**
   * Next page cursor, URL, or token from the server. Passed through on context only; the built-in
   * Prev/Next buttons still use numeric `page` unless you wire cursor logic yourself.
   */
  next?: unknown;
  /**
   * When set, controls the Next button (preferred over deriving from `total` so the server stays authoritative).
   */
  hasNext?: boolean;
  /** When `total` is omitted, controls the Previous button (defaults to `page > 1`). */
  hasPrevious?: boolean;
}

/** Result shape for the data service. */
export interface ServiceResult<TRecord> {
  data: TRecord[];
  meta: DataTableQueryMeta;
}

/** Arguments passed to `service.getAll`. */
export interface ServiceQuery<TFilters extends FilterValues = FilterValues> {
  page: number;
  perPage: number;
  sorting: SortingState;
  filters: MergedTableFilters<TFilters>;
}

/** Payload returned from `openModal` handlers to describe which modal to open. */
export interface ModalPayload {
  type: string;
  props?: Record<string, unknown>;
}

export type ModalOpenResult = ModalPayload | void | undefined;
export type ModalOpenAsyncResult = ModalOpenResult | Promise<ModalOpenResult>;

/** Arguments passed to consumer `onOpenModal` (modal props plus contextual data). */
export type OpenModalCallbackProps = Record<string, unknown>;

export type OpenModalCallback = (type: string, props: OpenModalCallbackProps) => void;

export type DataTableViewMode = 'table' | 'grid' | 'list' | 'map';

export type DataTableRefetch<TRecord> = (
  options?: RefetchOptions
) => Promise<QueryObserverResult<ServiceResult<TRecord> | undefined, Error>>;

/**
 * Mutable table UI state and helpers passed to actions, filters, and URL hooks.
 * Generic over the row type and your filter record so callbacks stay typed.
 */
export interface DataTableActionsContext<TRecord, TFilters extends FilterValues = FilterValues> {
  refetch: DataTableRefetch<TRecord>;
  isFetching: boolean;
  page: number;
  perPage: number;
  viewMode: DataTableViewMode;
  sorting: SortingState;
  filters: MergedTableFilters<TFilters>;
  /** Rows from the current page (latest successful query). */
  rows: TRecord[];
  /** Meta from the latest successful query, if any. */
  meta: DataTableQueryMeta | undefined;
  setPage: Dispatch<SetStateAction<number>>;
  setPerPage: Dispatch<SetStateAction<number>>;
  setViewMode: Dispatch<SetStateAction<DataTableViewMode>>;
  setSorting: Dispatch<SetStateAction<SortingState>>;
  setFilters: Dispatch<SetStateAction<MergedTableFilters<TFilters>>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
  /** Replaces filter state (include search keys if you use `searchFields`). */
  applyFilters: (nextFilters: MergedTableFilters<TFilters>) => void;
  resetFilters: () => void;
  refresh: () => ReturnType<DataTableRefetch<TRecord>>;
}

/** Optional icon component (e.g. from lucide-react). */
export type TableIconComponent = ComponentType<{ className?: string }>;

/** Column definition with optional `sortable` alias mapped to TanStack `enableSorting`. */
export type DataTableColumnDef<TRecord> = ColumnDef<TRecord> & {
  sortable?: boolean;
};

export interface DataTableViewRendererArgs<TRecord, TFilters extends FilterValues = FilterValues> {
  record: TRecord;
  index: number;
  context: DataTableActionsContext<TRecord, TFilters>;
  onOpenModal?: OpenModalCallback;
}

export interface DataTableMapCoordinates {
  lat: number;
  lng: number;
}

export interface DataTableMapItemRenderArgs<TRecord, TFilters extends FilterValues = FilterValues>
  extends DataTableViewRendererArgs<TRecord, TFilters> {
  coordinates: DataTableMapCoordinates;
  isActive: boolean;
  select: () => void;
}

export interface DataTableMapViewConfig<TRecord, TFilters extends FilterValues = FilterValues> {
  getCoordinates: (record: TRecord) => DataTableMapCoordinates | null | undefined;
  renderCard: (args: DataTableMapItemRenderArgs<TRecord, TFilters>) => ReactNode;
  /**
   * `full` (default): map fills the container width (no sidebar); tap a marker to open a Leaflet
   * popup whose content is `renderCard` mounted with React (interactive, same args as grid/list).
   * `split`: sidebar list plus map; optional `renderPopup` uses static Leaflet HTML instead.
   */
  layout?: 'split' | 'full';
  renderPopup?: (args: DataTableMapItemRenderArgs<TRecord, TFilters>) => ReactNode;
  sidebarTitle?: ReactNode;
  /** Raster tile URL template (Leaflet `{s}`, `{z}`, `{x}`, `{y}`). Defaults to OpenStreetMap’s standard tile layer. */
  tileLayerUrl?: string;
  /** Attribution HTML string for the tile layer (required by most tile providers). */
  tileAttribution?: string;
  /** Map center as `[lng, lat]` (same component order as GeoJSON coordinates). */
  initialCenter?: [number, number];
  initialZoom?: number;
  fitBoundsPadding?: number;
  minZoom?: number;
  maxZoom?: number;
  showNavigation?: boolean;
}

export type ModalRegistryArgs<TRecord, TFilters extends FilterValues = FilterValues> =
  | { context: DataTableActionsContext<TRecord, TFilters> }
  | { context: DataTableActionsContext<TRecord, TFilters>; record: TRecord };

export type ModalRegistryHandler<TRecord = unknown, TFilters extends FilterValues = FilterValues> = (
  args: ModalRegistryArgs<TRecord, TFilters>
) => void | Promise<void>;

export function isModalPayload(value: ModalOpenResult): value is ModalPayload {
  return (
    value != null &&
    typeof value === 'object' &&
    'type' in value &&
    typeof (value as ModalPayload).type === 'string'
  );
}
