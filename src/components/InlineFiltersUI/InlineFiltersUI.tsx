import React from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { DataTableActionsContext, FilterValues, MergedTableFilters } from '../../tableTypes';

/** Arguments passed to `filtersUI.render`. */
export type InlineFiltersRenderArgs<TRecord, TFilters extends FilterValues = FilterValues> = {
  context: DataTableActionsContext<TRecord, TFilters>;
  filters: MergedTableFilters<TFilters>;
  applyFilters: DataTableActionsContext<TRecord, TFilters>['applyFilters'];
  /** Clears filters and search (same as table `resetFilters`). */
  resetFilters: DataTableActionsContext<TRecord, TFilters>['resetFilters'];
};

/**
 * Props for the host component that renders `formConfig` + `onApply` bags
 * (either per-config `filtersUI.Component` or the app-wide default from {@link setDefaultDataTableFiltersHost}).
 *
 * `context` is typed loosely so one host works with any `DataTable<TRecord, TFilters>`; at runtime it is the real table context.
 */
export type DataTableFiltersUIHostProps = {
  context: DataTableActionsContext<unknown, FilterValues>;
  /** Full `filtersUI` object from table config (pass-through for app-specific keys). */
  filtersUI: Record<string, unknown>;
  /** Result of `formConfig()`. */
  formConfig: unknown;
  /** Call with submitted values; the table wires this to `onApply({ values, context })`. */
  onApply: (values: unknown) => void;
};

type AnyFiltersHost = ComponentType<DataTableFiltersUIHostProps>;

let defaultFiltersHost: AnyFiltersHost | null = null;

/**
 * Register the component that renders `filtersUI` objects which only define
 * `formConfig` + `onApply` (no per-table `Component` or `render`).
 *
 * Call **once** at app startup (e.g. next to `QueryClientProvider`), passing your
 * dynamic form (grid layout, Bitrix `request` / `mapOptions`, etc.).
 *
 * ```tsx
 * import { setDefaultDataTableFiltersHost } from 'genesis-react-data-table';
 * import { UnitFiltersFormHost } from '@/components/filters/UnitFiltersFormHost';
 *
 * setDefaultDataTableFiltersHost(UnitFiltersFormHost);
 * ```
 */
export function setDefaultDataTableFiltersHost(host: AnyFiltersHost | null): void {
  defaultFiltersHost = host;
}

/**
 * Object shape for `config.filtersUI`. Extra keys (e.g. app-specific form metadata)
 * are allowed and passed through to `Component` via `filtersUI`.
 */
export type DataTableFiltersUIBag<TRecord, TFilters extends FilterValues = FilterValues> = {
  render?: (args: InlineFiltersRenderArgs<TRecord, TFilters>) => ReactNode;
  /**
   * Optional host for this table only. Same props as {@link DataTableFiltersUIHostProps}.
   * Overrides the app-wide default from {@link setDefaultDataTableFiltersHost}.
   */
  Component?: ComponentType<DataTableFiltersUIHostProps>;
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

function renderFormConfigBag<TRecord, TFilters extends FilterValues>(
  filtersUI: DataTableFiltersUIBag<TRecord, TFilters>,
  context: DataTableActionsContext<TRecord, TFilters>,
  Host: AnyFiltersHost
) {
  const formConfig = typeof filtersUI.formConfig === 'function' ? filtersUI.formConfig() : undefined;
  const onApply = (values: unknown) => {
    filtersUI.onApply?.({ values, context });
  };
  return (
    <Host
      context={context as unknown as DataTableActionsContext<unknown, FilterValues>}
      filtersUI={filtersUI as Record<string, unknown>}
      formConfig={formConfig}
      onApply={onApply}
    />
  );
}

/**
 * Default inline filters slot used by `DataTable` when `renderFilters` is not set
 * and `config.filtersUI` is provided.
 *
 * - **`filtersUI` as function:** `(context) => ReactNode`
 * - **`filtersUI.render`:** `(args) => ReactNode`
 * - **`filtersUI.Component`:** host for `formConfig` + `onApply`
 * - **`formConfig` + `onApply` only:** uses {@link setDefaultDataTableFiltersHost} if you registered one
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

  const explicitHost = filtersUI.Component;
  if (explicitHost) {
    if (typeof filtersUI.formConfig !== 'function' || typeof filtersUI.onApply !== 'function') {
      return null;
    }
    return renderFormConfigBag(filtersUI, context, explicitHost);
  }

  if (
    defaultFiltersHost &&
    typeof filtersUI.formConfig === 'function' &&
    typeof filtersUI.onApply === 'function'
  ) {
    return renderFormConfigBag(filtersUI, context, defaultFiltersHost);
  }

  return null;
}

export default InlineFiltersUI;
