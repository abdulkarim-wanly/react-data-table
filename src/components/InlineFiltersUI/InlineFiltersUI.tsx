import React from 'react';
import type { DataTableActionsContext, FilterValues, MergedTableFilters } from '../../tableTypes';

/**
 * Placeholder component for inline filters. This component is intentionally
 * minimal: it renders nothing by default. Consumers of the library can
 * ignore this export or provide their own implementation. To implement a
 * custom filters UI, pass a `filtersUI` object into the DataTable `config`
 * and handle the filters logic within your application.
 */
export interface InlineFiltersUIProps<
  TRecord = unknown,
  TFilters extends FilterValues = FilterValues,
> {
  /** Current filters from the table (includes optional `search` / `searchFields` when search is enabled). */
  filters?: MergedTableFilters<TFilters>;
  /** Applies filters and resets to page 1. */
  applyFilters?: (filters: MergedTableFilters<TFilters>) => void;
  resetFilters?: () => void;
  context?: DataTableActionsContext<TRecord, TFilters>;
}

export function InlineFiltersUI<TRecord = unknown, TFilters extends FilterValues = FilterValues>(
  _props: InlineFiltersUIProps<TRecord, TFilters>
) {
  return null;
}

export default InlineFiltersUI;
