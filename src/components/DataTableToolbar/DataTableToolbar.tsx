import React from 'react';
import { Check, ChevronDown, LayoutGrid, RefreshCw } from 'lucide-react';

import type { DataTableClassNames, DataTableLabels } from '../../dataTableLayout';
import type { DataTableViewMode } from '../../tableTypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ').trim();
}

type ToolbarClassNames = Pick<
  DataTableClassNames,
  | 'toolbarShell'
  | 'toolbarRow'
  | 'toolbarLeft'
  | 'toolbarRight'
  | 'toolbarMenuButton'
  | 'toolbarMenuLabel'
  | 'toolbarMenuIcon'
  | 'toolbarChevron'
  | 'toolbarDropdownMenuContent'
  | 'toolbarDropdownMenuItem'
  | 'toolbarDropdownMenuItemActive'
  | 'toolbarSearchFiltersCluster'
  | 'toolbarFiltersBeside'
  | 'toolbarSearchWrap'
  | 'toolbarRefreshButton'
>;

type ToolbarLabels = Pick<
  DataTableLabels,
  | 'toolbarView'
  | 'toolbarRefresh'
  | 'viewAsTable'
  | 'viewAsGrid'
  | 'viewAsList'
  | 'viewAsMap'
>;

export interface DataTableToolbarProps {
  classNames: ToolbarClassNames;
  labels: ToolbarLabels;
  /** Hosted filters (`InlineFiltersUI` / `renderFilters`) — beside the search field. */
  filtersPanel: React.ReactNode | null;
  hasFilters: boolean;
  searchSlot: React.ReactNode | null;
  viewModes: DataTableViewMode[];
  currentViewMode: DataTableViewMode;
  onViewMode: (mode: DataTableViewMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function viewModeLabel(
  mode: DataTableViewMode,
  labels: ToolbarLabels
): string {
  if (mode === 'grid') return labels.viewAsGrid;
  if (mode === 'list') return labels.viewAsList;
  if (mode === 'map') return labels.viewAsMap;
  return labels.viewAsTable;
}

export function DataTableToolbar({
  classNames: c,
  labels,
  filtersPanel,
  hasFilters,
  searchSlot,
  viewModes,
  currentViewMode,
  onViewMode,
  onRefresh,
  isRefreshing,
}: DataTableToolbarProps) {
  const hasViews = viewModes.length > 1;
  const showSearchFiltersCluster = Boolean(searchSlot || (hasFilters && filtersPanel));

  return (
    <div className={joinClasses(c.toolbarShell)}>
      <div className={joinClasses(c.toolbarRow)}>
        <div className={joinClasses(c.toolbarLeft)}>
          {showSearchFiltersCluster ? (
            <div className={joinClasses(c.toolbarSearchFiltersCluster)}>
              {searchSlot ? (
                <div className={joinClasses(c.toolbarSearchWrap)}>{searchSlot}</div>
              ) : null}
              {hasFilters && filtersPanel ? (
                <div className={joinClasses(c.toolbarFiltersBeside)}>{filtersPanel}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={joinClasses(c.toolbarRight)}>
          {hasViews ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={joinClasses(c.toolbarMenuButton)}>
                  <LayoutGrid className={joinClasses(c.toolbarMenuIcon)} aria-hidden />
                  <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarView}</span>
                  <ChevronDown className={joinClasses(c.toolbarChevron)} aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className={joinClasses(c.toolbarDropdownMenuContent)}
              >
                {viewModes.map((mode) => {
                  const label = viewModeLabel(mode, labels);
                  const active = mode === currentViewMode;
                  return (
                    <DropdownMenuItem
                      key={mode}
                      className={joinClasses(
                        c.toolbarDropdownMenuItem,
                        active ? c.toolbarDropdownMenuItemActive : ''
                      )}
                      onSelect={() => onViewMode(mode)}
                    >
                      <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
                        {active ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        ) : null}
                      </span>
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <button
            type="button"
            className={joinClasses(c.toolbarRefreshButton)}
            onClick={() => onRefresh()}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            <RefreshCw
              className={joinClasses(c.toolbarMenuIcon, isRefreshing ? 'animate-spin' : '')}
              aria-hidden
            />
            <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarRefresh}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
