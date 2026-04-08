import React from 'react';
import type { SortingState } from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

import type { DataTableClassNames, DataTableLabels } from '../../dataTableLayout';
import type { DataTableViewMode } from '../../tableTypes';

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ').trim();
}

type ToolbarClassNames = Pick<
  DataTableClassNames,
  | 'toolbarShell'
  | 'toolbarRow'
  | 'toolbarLeft'
  | 'toolbarRight'
  | 'toolbarMenuWrap'
  | 'toolbarMenuButton'
  | 'toolbarMenuButtonOpen'
  | 'toolbarMenuLabel'
  | 'toolbarMenuIcon'
  | 'toolbarChevron'
  | 'toolbarDropdown'
  | 'toolbarDropdownAlignEnd'
  | 'toolbarDropdownItem'
  | 'toolbarDropdownItemActive'
  | 'toolbarFiltersStrip'
  | 'toolbarFiltersStripHeader'
  | 'toolbarFiltersStripTitle'
  | 'toolbarFiltersStripBody'
  | 'toolbarFiltersStripResetButton'
  | 'toolbarSearchWrap'
  | 'toolbarRefreshButton'
>;

type ToolbarLabels = Pick<
  DataTableLabels,
  | 'toolbarSort'
  | 'toolbarView'
  | 'toolbarRefresh'
  | 'toolbarSortClear'
  | 'toolbarFiltersDialogTitleLabel'
  | 'toolbarResetFilters'
  | 'viewAsTable'
  | 'viewAsGrid'
  | 'viewAsList'
  | 'viewAsMap'
>;

export interface DataTableToolbarProps {
  classNames: ToolbarClassNames;
  labels: ToolbarLabels;
  /** Hosted filters (`InlineFiltersUI` / `renderFilters`) rendered inline below the toolbar row. */
  filtersPanel: React.ReactNode | null;
  hasFilters: boolean;
  /** Wired to table `resetFilters` (clears filters + search). */
  onResetFilters: () => void;
  searchSlot: React.ReactNode | null;
  sortColumns: { id: string; label: string }[];
  sorting: SortingState;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
  viewModes: DataTableViewMode[];
  currentViewMode: DataTableViewMode;
  onViewMode: (mode: DataTableViewMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

type DropdownMenu = 'sort' | 'view' | null;

function useCloseOnOutsideClick(
  enabled: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>
) {
  React.useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: PointerEvent) => {
      const el = containerRef.current;
      if (!el || !(event.target instanceof Node) || el.contains(event.target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [enabled, onClose, containerRef]);
}

export function DataTableToolbar({
  classNames: c,
  labels,
  filtersPanel,
  hasFilters,
  onResetFilters,
  searchSlot,
  sortColumns,
  sorting,
  onSortingChange,
  viewModes,
  currentViewMode,
  onViewMode,
  onRefresh,
  isRefreshing,
}: DataTableToolbarProps) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = React.useState<DropdownMenu>(null);

  const closeDropdowns = React.useCallback(() => setMenuOpen(null), []);

  useCloseOnOutsideClick(menuOpen !== null, closeDropdowns, shellRef);

  const hasSort = sortColumns.length > 0;
  const hasViews = viewModes.length > 1;

  const currentSort = sorting[0];

  const toggleSortMenu = () => {
    setMenuOpen((m) => (m === 'sort' ? null : 'sort'));
  };

  const toggleViewMenu = () => {
    setMenuOpen((m) => (m === 'view' ? null : 'view'));
  };

  const handleSortColumn = (columnId: string) => {
    onSortingChange((prev) => {
      const cur = prev[0];
      if (cur?.id === columnId) {
        if (cur.desc === false) return [{ id: columnId, desc: true }];
        return [];
      }
      return [{ id: columnId, desc: false }];
    });
    setMenuOpen(null);
  };

  const clearSort = () => {
    onSortingChange([]);
    setMenuOpen(null);
  };

  return (
    <div ref={shellRef} className={joinClasses(c.toolbarShell)}>
      <div className={joinClasses(c.toolbarRow)}>
        <div className={joinClasses(c.toolbarLeft)}>
          {hasSort ? (
            <div className={joinClasses(c.toolbarMenuWrap)}>
              <button
                type="button"
                className={joinClasses(
                  c.toolbarMenuButton,
                  menuOpen === 'sort' ? c.toolbarMenuButtonOpen : ''
                )}
                aria-expanded={menuOpen === 'sort'}
                onClick={toggleSortMenu}
              >
                <ArrowUpDown className={joinClasses(c.toolbarMenuIcon)} aria-hidden />
                <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarSort}</span>
              </button>
              {menuOpen === 'sort' ? (
                <div className={joinClasses(c.toolbarDropdown)} role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className={joinClasses(c.toolbarDropdownItem)}
                    onClick={clearSort}
                  >
                    {labels.toolbarSortClear}
                  </button>
                  {sortColumns.map((col) => {
                    const active = currentSort?.id === col.id;
                    const dir = active ? (currentSort?.desc ? 'desc' : 'asc') : null;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        role="menuitem"
                        className={joinClasses(
                          c.toolbarDropdownItem,
                          active ? c.toolbarDropdownItemActive : ''
                        )}
                        onClick={() => handleSortColumn(col.id)}
                      >
                        {col.label}
                        {dir === 'asc' ? ' · ↑' : dir === 'desc' ? ' · ↓' : ''}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {searchSlot ? (
            <div className={joinClasses(c.toolbarSearchWrap)}>{searchSlot}</div>
          ) : null}
        </div>

        <div className={joinClasses(c.toolbarRight)}>
          {hasViews ? (
            <div className={joinClasses(c.toolbarMenuWrap)}>
              <button
                type="button"
                className={joinClasses(
                  c.toolbarMenuButton,
                  menuOpen === 'view' ? c.toolbarMenuButtonOpen : ''
                )}
                aria-expanded={menuOpen === 'view'}
                aria-haspopup="menu"
                onClick={toggleViewMenu}
              >
                <SlidersHorizontal className={joinClasses(c.toolbarMenuIcon)} aria-hidden />
                <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarView}</span>
                <ChevronDown className={joinClasses(c.toolbarChevron)} aria-hidden />
              </button>
              {menuOpen === 'view' ? (
                <div
                  className={joinClasses(c.toolbarDropdown, c.toolbarDropdownAlignEnd)}
                  role="menu"
                >
                  {viewModes.map((mode) => {
                    const label =
                      mode === 'grid'
                        ? labels.viewAsGrid
                        : mode === 'list'
                          ? labels.viewAsList
                          : mode === 'map'
                            ? labels.viewAsMap
                            : labels.viewAsTable;
                    const active = mode === currentViewMode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="menuitem"
                        className={joinClasses(
                          c.toolbarDropdownItem,
                          active ? c.toolbarDropdownItemActive : ''
                        )}
                        onClick={() => {
                          onViewMode(mode);
                          setMenuOpen(null);
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
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

      {hasFilters && filtersPanel ? (
        <div className={joinClasses(c.toolbarFiltersStrip)}>
          <div className={joinClasses(c.toolbarFiltersStripHeader)}>
            <div className={joinClasses(c.toolbarFiltersStripTitle)}>
              <Filter className="h-4 w-4 shrink-0 text-neutral-600 dark:text-neutral-400" aria-hidden />
              <span>{labels.toolbarFiltersDialogTitleLabel}</span>
            </div>
            <button
              type="button"
              className={joinClasses(c.toolbarFiltersStripResetButton)}
              onClick={() => onResetFilters()}
            >
              {labels.toolbarResetFilters}
            </button>
          </div>
          <div className={joinClasses(c.toolbarFiltersStripBody)}>{filtersPanel}</div>
        </div>
      ) : null}
    </div>
  );
}
