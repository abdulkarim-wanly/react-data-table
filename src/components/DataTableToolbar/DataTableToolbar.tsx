import React from 'react';
import {
  Check,
  Grid2x2,
  LayoutList,
  MapPinned,
  RefreshCw,
  Search,
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
  | 'toolbarMenuIcon'
  | 'toolbarDropdownMenuContent'
  | 'toolbarDropdownMenuItem'
  | 'toolbarDropdownMenuItemActive'
  | 'toolbarDropdownItemIconWrap'
  | 'toolbarDropdownItemIconWrapActive'
  | 'toolbarSearchFiltersCluster'
  | 'toolbarFiltersBeside'
  | 'toolbarSearchWrap'
  | 'toolbarRefreshButton'
  | 'toolbarSearchExpand'
  | 'toolbarSearchExpandOpen'
  | 'toolbarSearchExpandClosed'
  | 'toolbarButtonViewMode'
  | 'toolbarButtonSearchOpen'
  | 'toolbarButtonSearchClose'
>;

type ToolbarLabels = Pick<
  DataTableLabels,
  | 'toolbarView'
  | 'toolbarRefresh'
  | 'toolbarSearchOpen'
  | 'toolbarSearchClose'
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
  /** Opens the chrome search field when the table already has a query (e.g. URL). */
  searchHasValue?: boolean;
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
  searchHasValue = false,
  viewModes,
  currentViewMode,
  onViewMode,
  onRefresh,
  isRefreshing,
}: DataTableToolbarProps) {
  const hasViews = viewModes.length > 1;
  const [searchOpen, setSearchOpen] = React.useState(() => searchHasValue);

  React.useEffect(() => {
    if (searchHasValue) setSearchOpen(true);
  }, [searchHasValue]);

  const searchShellRef = React.useRef<HTMLDivElement>(null);
  const searchInputMountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => {
      const input = searchInputMountRef.current?.querySelector<HTMLInputElement>('input');
      input?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (searchShellRef.current?.contains(e.target as Node)) return;
      setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [searchOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const showSearchFiltersCluster = Boolean(searchSlot || (hasFilters && filtersPanel));
  const currentView = getViewModeMeta(currentViewMode, labels);

  const searchExpandable = searchSlot ? (
    <div
      ref={searchShellRef}
      className={joinClasses(
        c.toolbarSearchExpand,
        searchOpen ? c.toolbarSearchExpandOpen : c.toolbarSearchExpandClosed,
        !searchOpen && 'justify-center'
      )}
    >
      {searchOpen ? (
        <div className="flex min-w-0 flex-1 items-center">
          <button
            type="button"
            className={joinClasses(c.toolbarButtonSearchClose)}
            onClick={() => setSearchOpen(false)}
            aria-label={labels.toolbarSearchClose}
          >
            <Search className={joinClasses(c.toolbarMenuIcon, 'text-current')} aria-hidden />
          </button>
          <div
            ref={searchInputMountRef}
            className={joinClasses(
              c.toolbarSearchWrap,
              'min-w-0 flex-1 pr-2 [&_input]:rounded-l-none'
            )}
          >
            {searchSlot}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={joinClasses(c.toolbarButtonSearchOpen)}
          aria-expanded={false}
          aria-label={labels.toolbarSearchOpen}
          onClick={() => setSearchOpen(true)}
        >
          <Search className={joinClasses(c.toolbarMenuIcon, 'text-current')} aria-hidden />
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className={joinClasses(c.toolbarShell)}>
      <div className={joinClasses(c.toolbarRow)}>
        <div className={joinClasses(c.toolbarLeft)}>
          {showSearchFiltersCluster ? (
            <div className={joinClasses(c.toolbarSearchFiltersCluster)}>
              {searchExpandable}
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
                  className={joinClasses(c.toolbarButtonViewMode)}
                  aria-label={`${labels.toolbarView}: ${currentView.label}`}
                >
                  <currentView.Icon
                    className={joinClasses(c.toolbarMenuIcon, 'text-current')}
                    aria-hidden
                  />
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
                          c.toolbarDropdownItemIconWrap,
                          active ? c.toolbarDropdownItemIconWrapActive : ''
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
            aria-label={labels.toolbarRefresh}
          >
            <RefreshCw
              className={joinClasses(
                c.toolbarMenuIcon,
                'text-current',
                isRefreshing ? 'animate-spin' : ''
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}
