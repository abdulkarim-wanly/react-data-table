import React from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { DataTableActionsContext, FilterValues, MergedTableFilters } from '../../tableTypes';

/** Arguments passed to `filtersUI.render`. */
export type InlineFiltersRenderArgs<TRecord, TFilters extends FilterValues = FilterValues> = {
  context: DataTableActionsContext<TRecord, TFilters>;
  filters: MergedTableFilters<TFilters>;
  applyFilters: DataTableActionsContext<TRecord, TFilters>['applyFilters'];
  resetFilters: DataTableActionsContext<TRecord, TFilters>['resetFilters'];
};

/**
 * Object shape for `config.filtersUI`. Extra keys (e.g. app-specific form metadata)
 * are allowed and passed through to `Component` via `filtersUI`.
 */
export type DataTableFiltersUIBag<TRecord, TFilters extends FilterValues = FilterValues> = {
  render?: (args: InlineFiltersRenderArgs<TRecord, TFilters>) => ReactNode;
  /**
   * Optional host component for object-shaped `filtersUI` (e.g. `formConfig` + `onApply`).
   * Receives evaluated `formConfig`, a wrapped `onApply`, the table `context`, and the full bag.
   */
  Component?: ComponentType<{
    context: DataTableActionsContext<TRecord, TFilters>;
    filtersUI: Record<string, unknown>;
    formConfig: unknown;
    onApply: (values: unknown) => void;
  }>;
  formConfig?: () => unknown;
  onApply?: (args: { values: unknown; context: DataTableActionsContext<TRecord, TFilters> }) => void;
} & Record<string, unknown>;

/**
 * Inline filters slot: either a render function `(context) => node` or a config bag
 * with optional `render`, `Component`, `formConfig`, and `onApply`.
 */
export type DataTableFiltersUISlot<TRecord, TFilters extends FilterValues = FilterValues> =
  | DataTableFiltersUIBag<TRecord, TFilters>
  | ((context: DataTableActionsContext<TRecord, TFilters>) => ReactNode);

export interface InlineFiltersUIProps<TRecord = unknown, TFilters extends FilterValues = FilterValues> {
  context: DataTableActionsContext<TRecord, TFilters>;
  filtersUI: DataTableFiltersUISlot<TRecord, TFilters>;
}

/**
 * Default inline filters slot used by `DataTable` when `renderFilters` is not set
 * and `config.filtersUI` is provided.
 *
 * Supports:
 * - **`filtersUI` as function:** `(context) => ReactNode`
 * - **`filtersUI.render`:** `(args) => ReactNode` with `context`, `filters`, `applyFilters`, `resetFilters`
 * - **`filtersUI.Component`:** React component with `context`, `formConfig`, `onApply(values)`, `filtersUI` bag
 *
 * If the bag has only `formConfig` / `onApply` and no `render` or `Component`, nothing is rendered
 * (add a `Component` that reads your form config, or use `render`).
 */
export function InlineFiltersUI<TRecord = unknown, TFilters extends FilterValues = FilterValues>({
  context,
  filtersUI,
}: InlineFiltersUIProps<TRecord, TFilters>) {
  const { filters, applyFilters, resetFilters } = context;

  if (typeof filtersUI === 'function') {
    return <>{filtersUI(context)}</>;
  }

  const render = filtersUI.render;
  if (typeof render === 'function') {
    return <>{render({ context, filters, applyFilters, resetFilters })}</>;
  }

  const Component = filtersUI.Component;
  if (Component) {
    const formConfig = typeof filtersUI.formConfig === 'function' ? filtersUI.formConfig() : undefined;
    const onApply = (values: unknown) => {
      filtersUI.onApply?.({ values, context });
    };
    return (
      <Component
        context={context}
        filtersUI={filtersUI as Record<string, unknown>}
        formConfig={formConfig}
        onApply={onApply}
      />
    );
  }

  return null;
}

export default InlineFiltersUI;
