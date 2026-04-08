import React from 'react';
import {
  Check,
  ChevronDown,
  Grid2x2,
  LayoutList,
  MapPinned,
  RefreshCw,
  Table2,
  type LucideIcon,
} from 'lucide-react';

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

type ViewModeMeta = {
  label: string;
  Icon: LucideIcon;
};

function getViewModeMeta(
  mode: DataTableViewMode,
  labels: ToolbarLabels
): ViewModeMeta {
  if (mode === 'grid') return { label: labels.viewAsGrid, Icon: Grid2x2 };
  if (mode === 'list') return { label: labels.viewAsList, Icon: LayoutList };
  if (mode === 'map') return { label: labels.viewAsMap, Icon: MapPinned };
  return { label: labels.viewAsTable, Icon: Table2 };
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
  const currentView = getViewModeMeta(currentViewMode, labels);

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
                <button
                  type="button"
                  className={joinClasses(c.toolbarMenuButton, 'group')}
                  aria-label={`${labels.toolbarView}: ${currentView.label}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-white group-hover:text-slate-900">
                    <currentView.Icon
                      className={joinClasses(c.toolbarMenuIcon, 'text-current')}
                      aria-hidden
                    />
                  </span>
                  <span className="flex min-w-0 flex-col items-start leading-tight">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {labels.toolbarView}
                    </span>
                    <span className={joinClasses(c.toolbarMenuLabel, 'truncate')}>
                      {currentView.label}
                    </span>
                  </span>
                  <ChevronDown className={joinClasses(c.toolbarChevron)} aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className={joinClasses(c.toolbarDropdownMenuContent)}
              >
                {viewModes.map((mode) => {
                  const { label, Icon } = getViewModeMeta(mode, labels);
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
                      <span
                        className={joinClasses(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent',
                          active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center">
                        {active ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        ) : null}
                      </span>
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <RefreshCw
                className={joinClasses(
                  c.toolbarMenuIcon,
                  'text-current',
                  isRefreshing ? 'animate-spin' : ''
                )}
                aria-hidden
              />
            </span>
            <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarRefresh}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
