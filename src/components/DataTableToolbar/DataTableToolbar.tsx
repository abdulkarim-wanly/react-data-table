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
  | 'toolbarFiltersBody'
  | 'toolbarSearchWrap'
  | 'toolbarRefreshButton'
>;

type ToolbarLabels = Pick<
  DataTableLabels,
  | 'toolbarFilters'
  | 'toolbarSort'
  | 'toolbarView'
  | 'toolbarRefresh'
  | 'toolbarSortClear'
  | 'viewAsTable'
  | 'viewAsGrid'
  | 'viewAsList'
  | 'viewAsMap'
>;

export interface DataTableToolbarProps {
  classNames: ToolbarClassNames;
  labels: ToolbarLabels;
  /** Inline filters UI (same as `filtersEl`); shown when the Filters panel is open. */
  filtersPanel: React.ReactNode | null;
  hasFilters: boolean;
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

type OpenPanel = 'filters' | 'sort' | 'view' | null;

function useCloseOnOutsideClick(
  open: OpenPanel,
  setOpen: React.Dispatch<React.SetStateAction<OpenPanel>>,
  containerRef: React.RefObject<HTMLElement | null>
) {
  React.useEffect(() => {
    if (open == null) return;
    const onPointerDown = (event: PointerEvent) => {
      const el = containerRef.current;
      if (!el || !(event.target instanceof Node) || el.contains(event.target)) return;
      setOpen(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, setOpen, containerRef]);
}

export function DataTableToolbar({
  classNames: c,
  labels,
  filtersPanel,
  hasFilters,
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
  const [openPanel, setOpenPanel] = React.useState<OpenPanel>(null);

  useCloseOnOutsideClick(openPanel, setOpenPanel, shellRef);

  const hasSort = sortColumns.length > 0;
  const hasViews = viewModes.length > 1;
  const showFiltersBody = openPanel === 'filters' && hasFilters && filtersPanel;

  const currentSort = sorting[0];

  const togglePanel = (key: Exclude<OpenPanel, null>) => {
    setOpenPanel((prev) => (prev === key ? null : key));
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
    setOpenPanel(null);
  };

  const clearSort = () => {
    onSortingChange([]);
    setOpenPanel(null);
  };

  return (
    <div ref={shellRef} className={joinClasses(c.toolbarShell)}>
      <div className={joinClasses(c.toolbarRow)}>
        <div className={joinClasses(c.toolbarLeft)}>
          {hasFilters ? (
            <div className={joinClasses(c.toolbarMenuWrap)}>
              <button
                type="button"
                className={joinClasses(
                  c.toolbarMenuButton,
                  openPanel === 'filters' ? c.toolbarMenuButtonOpen : ''
                )}
                aria-expanded={openPanel === 'filters'}
                onClick={() => togglePanel('filters')}
              >
                <Filter className={joinClasses(c.toolbarMenuIcon)} aria-hidden />
                <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarFilters}</span>
              </button>
            </div>
          ) : null}

          {hasSort ? (
            <div className={joinClasses(c.toolbarMenuWrap)}>
              <button
                type="button"
                className={joinClasses(
                  c.toolbarMenuButton,
                  openPanel === 'sort' ? c.toolbarMenuButtonOpen : ''
                )}
                aria-expanded={openPanel === 'sort'}
                onClick={() => togglePanel('sort')}
              >
                <ArrowUpDown className={joinClasses(c.toolbarMenuIcon)} aria-hidden />
                <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarSort}</span>
              </button>
              {openPanel === 'sort' ? (
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
                  openPanel === 'view' ? c.toolbarMenuButtonOpen : ''
                )}
                aria-expanded={openPanel === 'view'}
                aria-haspopup="menu"
                onClick={() => togglePanel('view')}
              >
                <SlidersHorizontal className={joinClasses(c.toolbarMenuIcon)} aria-hidden />
                <span className={joinClasses(c.toolbarMenuLabel)}>{labels.toolbarView}</span>
                <ChevronDown className={joinClasses(c.toolbarChevron)} aria-hidden />
              </button>
              {openPanel === 'view' ? (
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
                          setOpenPanel(null);
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

      {showFiltersBody ? (
        <div className={joinClasses(c.toolbarFiltersBody)}>{filtersPanel}</div>
      ) : null}
    </div>
  );
}
