// Barrel file for public exports. This file re‑exports the main components
// of the library so consumers can import from the package root. Keep this
// list concise and only export what should be part of the public API.

export type { DataTableConfig, DataTableProps } from './components/DataTable/DataTable';
export { DataTable } from './components/DataTable/DataTable';

export type {
  DataTableActionsContext,
  DataTableColumnDef,
  DataTableQueryMeta,
  DataTableSearchFilterKeys,
  FilterValues,
  MergedTableFilters,
  ModalOpenAsyncResult,
  ModalPayload,
  ModalRegistryHandler,
  OpenModalCallback,
  OpenModalCallbackProps,
  ServiceQuery,
  ServiceResult,
  TableIconComponent,
} from './tableTypes';
export { isModalPayload } from './tableTypes';

export type {
  DataTableFiltersUIBag,
  DataTableFiltersUIHostProps,
  DataTableFiltersUISlot,
  InlineFiltersRenderArgs,
  InlineFiltersUIProps,
} from './components/InlineFiltersUI/InlineFiltersUI';
export { setDefaultDataTableFiltersHost } from './components/InlineFiltersUI/InlineFiltersUI';

export type { TableAction, ActionButtonsBarProps } from './components/ActionButtonsBar/ActionButtonsBar';
export { ActionButtonsBar } from './components/ActionButtonsBar/ActionButtonsBar';

export type { RowAction, UserActionCellProps } from './components/UserActionCell/UserActionCell';
export { UserActionCell } from './components/UserActionCell/UserActionCell';

export { SearchInput } from './components/SearchInput/SearchInput';

export { componentCell } from './components/ColumnHelper';

export { InlineFiltersUI } from './components/InlineFiltersUI/InlineFiltersUI';
