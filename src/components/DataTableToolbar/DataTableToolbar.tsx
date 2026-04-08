import React from 'react';
import { createPortal } from 'react-dom';
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
  | 'toolbarFiltersDialogOverlay'
  | 'toolbarFiltersDialogPanel'
  | 'toolbarFiltersDialogHeader'
  | 'toolbarFiltersDialogTitle'
  | 'toolbarFiltersDialogBody'
  | 'toolbarFiltersDialogFooter'
  | 'toolbarFiltersDialogResetButton'
  | 'toolbarFiltersDialogDoneButton'
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
  | 'toolbarFiltersDialogTitleLabel'
  | 'toolbarResetFilters'
  | 'toolbarFiltersDone'
  | 'viewAsTable'
  | 'viewAsGrid'
  | 'viewAsList'
  | 'viewAsMap'
>;

export interface DataTableToolbarProps {
  classNames: ToolbarClassNames;
  labels: ToolbarLabels;
  /** Filters UI rendered inside the modal body (no separate clear control from the library). */
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
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [portalReady, setPortalReady] = React.useState(false);

  React.useEffect(() => {
    setPortalReady(typeof document !== 'undefined');
  }, []);

  const closeDropdowns = React.useCallback(() => setMenuOpen(null), []);

  useCloseOnOutsideClick(menuOpen !== null, closeDropdowns, shellRef);

  React.useEffect(() => {
    if (!filtersOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [filtersOpen]);

  React.useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

  const hasSort = sortColumns.length > 0;
  const hasViews = viewModes.length > 1;

  const currentSort = sorting[0];

  const toggleFilters = () => {
    setMenuOpen(null);
    setFiltersOpen((open) => !open);
  };

  const toggleSortMenu = () => {
    setFiltersOpen(false);
    setMenuOpen((m) => (m === 'sort' ? null : 'sort'));
  };

  const toggleViewMenu = () => {
    setFiltersOpen(false);
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

  const closeFiltersDialog = () => setFiltersOpen(false);

  const handleResetFilters = () => {
    onResetFilters();
  };

  const filtersDialog =
    portalReady &&
    filtersOpen &&
    hasFilters &&
    filtersPanel &&
    createPortal(
      <div
        className={joinClasses(c.toolbarFiltersDialogOverlay)}
        role="presentation"
        onClick={closeFiltersDialog}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="grdt-filters-dialog-title"
          className={joinClasses(c.toolbarFiltersDialogPanel)}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={joinClasses(c.toolbarFiltersDialogHeader)}>
            <h2 id="grdt-filters-dialog-title" className={joinClasses(c.toolbarFiltersDialogTitle)}>
              {labels.toolbarFiltersDialogTitleLabel}
            </h2>
          </div>
          <div className={joinClasses(c.toolbarFiltersDialogBody)}>{filtersPanel}</div>
          <div className={joinClasses(c.toolbarFiltersDialogFooter)}>
            <button
              type="button"
              className={joinClasses(c.toolbarFiltersDialogResetButton)}
              onClick={handleResetFilters}
            >
              {labels.toolbarResetFilters}
            </button>
            <button
              type="button"
              className={joinClasses(c.toolbarFiltersDialogDoneButton)}
              onClick={closeFiltersDialog}
            >
              {labels.toolbarFiltersDone}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {filtersDialog}
      <div ref={shellRef} className={joinClasses(c.toolbarShell)}>
        <div className={joinClasses(c.toolbarRow)}>
          <div className={joinClasses(c.toolbarLeft)}>
            {hasFilters ? (
              <div className={joinClasses(c.toolbarMenuWrap)}>
                <button
                  type="button"
                  className={joinClasses(
                    c.toolbarMenuButton,
                    filtersOpen ? c.toolbarMenuButtonOpen : ''
                  )}
                  aria-expanded={filtersOpen}
                  aria-haspopup="dialog"
                  onClick={toggleFilters}
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
      </div>
    </>
  );
}
