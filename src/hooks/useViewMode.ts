import React from 'react';
import type { DataTableViewMode } from '../tableTypes';
import type { DataTableViewsConfig } from '../components/DataTable/DataTable';
import type { FilterValues } from '../tableTypes';

function isDataTableViewMode(value: unknown): value is DataTableViewMode {
  return value === 'table' || value === 'grid' || value === 'list' || value === 'map';
}

function getViewModeStorageKey(tableId: string, customKey?: string): string {
  return customKey || `genesis-react-data-table:${tableId}:view-mode`;
}

export function readPersistedViewMode(
  tableId: string,
  views?: Pick<DataTableViewsConfig<never, FilterValues>, 'persistMode' | 'storageKey'>
): DataTableViewMode | null {
  if (
    views?.persistMode === false ||
    typeof globalThis === 'undefined' ||
    !('localStorage' in globalThis)
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

export function useViewMode(
  tableId: string,
  views?: Pick<DataTableViewsConfig<never, FilterValues>, 'persistMode' | 'storageKey' | 'defaultMode' | 'modes'>
) {
  const [viewMode, setViewMode] = React.useState<DataTableViewMode>(
    () =>
      readPersistedViewMode(tableId, views) ??
      views?.defaultMode ??
      'table'
  );

  React.useEffect(() => {
    if (
      views?.persistMode === false ||
      typeof globalThis === 'undefined' ||
      !('localStorage' in globalThis)
    ) {
      return;
    }
    try {
      globalThis.localStorage?.setItem(
        getViewModeStorageKey(tableId, views?.storageKey),
        viewMode
      );
    } catch {
      // Ignore storage write failures so rendering is never blocked by browser policy.
    }
  }, [views?.persistMode, views?.storageKey, tableId, viewMode]);

  return [viewMode, setViewMode] as const;
}
