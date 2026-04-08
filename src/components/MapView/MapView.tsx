import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

import type { DataTableClassNames, DataTableLabels } from '../../dataTableLayout';
import type {
  DataTableActionsContext,
  DataTableMapCoordinates,
  DataTableMapItemRenderArgs,
  DataTableMapViewConfig,
  FilterValues,
  OpenModalCallback,
} from '../../tableTypes';

type MapClassNames = Pick<
  DataTableClassNames,
  | 'mapViewRoot'
  | 'mapViewSplitGrid'
  | 'mapFloatingBar'
  | 'mapDetailPanel'
  | 'mapDetailClose'
  | 'mapSidebar'
  | 'mapSidebarHeader'
  | 'mapSidebarList'
  | 'mapCard'
  | 'mapCardActive'
  | 'mapCanvasShell'
  | 'mapCanvas'
  | 'mapEmptyState'
  | 'mapPopup'
>;

type MapLabels = Pick<DataTableLabels, 'mapResults' | 'mapNoCoordinates' | 'errorLoading'>;

type MappedRecord<TRecord> = {
  record: TRecord;
  index: number;
  coordinates: DataTableMapCoordinates;
};

type MarkerEntry = {
  marker: LeafletMarker;
  element: HTMLButtonElement;
};

const DEFAULT_TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function joinMapClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ').trim();
}

function hasValidCoordinates(value: DataTableMapCoordinates | null | undefined): value is DataTableMapCoordinates {
  return (
    value != null &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lng) <= 180
  );
}

function getMarkerStyles(isActive: boolean): Partial<CSSStyleDeclaration> {
  return {
    width: isActive ? '22px' : '18px',
    height: isActive ? '22px' : '18px',
    borderRadius: '999px',
    border: '3px solid #ffffff',
    background: isActive ? '#1d4ed8' : '#2563eb',
    boxShadow: isActive
      ? '0 0 0 6px rgba(37, 99, 235, 0.18), 0 8px 20px rgba(15, 23, 42, 0.2)'
      : '0 6px 18px rgba(15, 23, 42, 0.2)',
    transform: isActive ? 'scale(1.1)' : 'scale(1)',
    transition: 'transform 150ms ease, box-shadow 150ms ease, width 150ms ease, height 150ms ease',
    cursor: 'pointer',
  };
}

function applyMarkerStyles(element: HTMLButtonElement, isActive: boolean): void {
  Object.assign(element.style, getMarkerStyles(isActive));
}

function createMarkerElement(onActivate: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.setAttribute('aria-label', 'Map marker');
  element.style.padding = '0';
  element.style.outline = 'none';
  element.style.background = 'transparent';
  element.style.border = 'none';
  applyMarkerStyles(element, false);
  element.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onActivate();
  });
  return element;
}

function getPopupMarkup<TRecord, TFilters extends FilterValues>(
  renderPopup: DataTableMapViewConfig<TRecord, TFilters>['renderPopup'],
  args: DataTableMapItemRenderArgs<TRecord, TFilters>,
  popupClassName: string
): string | null {
  if (typeof renderPopup !== 'function') return null;
  return renderToStaticMarkup(<div className={popupClassName}>{renderPopup(args)}</div>);
}

export interface MapViewProps<TRecord, TFilters extends FilterValues = FilterValues> {
  records: TRecord[];
  context: DataTableActionsContext<TRecord, TFilters>;
  config: DataTableMapViewConfig<TRecord, TFilters>;
  classNames: MapClassNames;
  labels: MapLabels;
  isBusy: boolean;
  isError: boolean;
  skeletonRows: number;
  onOpenModal?: OpenModalCallback;
}

export function MapView<TRecord, TFilters extends FilterValues = FilterValues>({
  records,
  context,
  config,
  classNames,
  labels,
  isBusy,
  isError,
  skeletonRows,
  onOpenModal,
}: MapViewProps<TRecord, TFilters>) {
  const layout = config.layout ?? 'full';
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markersRef = React.useRef<Map<number, MarkerEntry>>(new Map());
  const cardRefs = React.useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const popupRootsRef = React.useRef<Map<number, Root>>(new Map());
  const activeIndexRef = React.useRef<number | null>(null);
  const layoutRef = React.useRef(layout);
  layoutRef.current = layout;

  const latestPopupRef = React.useRef({
    renderCard: config.renderCard,
    context,
    onOpenModal,
    classNames,
    selectItem: (() => {}) as (index: number) => void,
  });
  latestPopupRef.current.renderCard = config.renderCard;
  latestPopupRef.current.context = context;
  latestPopupRef.current.onOpenModal = onOpenModal;
  latestPopupRef.current.classNames = classNames;

  const [mapError, setMapError] = React.useState<string | null>(null);

  const mappedRecords = React.useMemo<MappedRecord<TRecord>[]>(() => {
    return records.reduce<MappedRecord<TRecord>[]>((acc, record, index) => {
      const coordinates = config.getCoordinates(record);
      if (hasValidCoordinates(coordinates)) {
        acc.push({ record, index, coordinates });
      }
      return acc;
    }, []);
  }, [records, config]);

  const [activeIndex, setActiveIndex] = React.useState<number | null>(() =>
    layout === 'split' ? (mappedRecords[0]?.index ?? null) : null
  );

  activeIndexRef.current = activeIndex;

  React.useEffect(() => {
    setActiveIndex((prev) => {
      if (layout === 'split') {
        if (prev != null && mappedRecords.some((item) => item.index === prev)) return prev;
        return mappedRecords[0]?.index ?? null;
      }
      if (prev == null) return null;
      return mappedRecords.some((item) => item.index === prev) ? prev : null;
    });
  }, [layout, mappedRecords]);

  React.useEffect(() => {
    if (layout !== 'split') return;
    if (activeIndex == null) return;
    const card = cardRefs.current.get(activeIndex);
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex, layout]);

  const selectItem = React.useCallback((index: number) => setActiveIndex(index), []);
  latestPopupRef.current.selectItem = selectItem;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    if (mappedRecords.length === 0 || isBusy || isError) return;

    let isDisposed = false;
    const useSplitPopups = layoutRef.current === 'split';
    const useFullPopups = layoutRef.current === 'full';

    (async () => {
      try {
        const leafletModule = await import('leaflet');
        const L = leafletModule.default;
        if (isDisposed || !mapContainerRef.current) return;

        const [lng0, lat0] =
          config.initialCenter ?? [mappedRecords[0].coordinates.lng, mappedRecords[0].coordinates.lat];
        const zoom = config.initialZoom ?? (mappedRecords.length > 1 ? 9 : 12);

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
        }).setView([lat0, lng0], zoom);

        mapRef.current = map;

        L.tileLayer(config.tileLayerUrl ?? DEFAULT_TILE_LAYER_URL, {
          attribution: config.tileAttribution ?? DEFAULT_TILE_ATTRIBUTION,
        }).addTo(map);

        if (config.showNavigation !== false) {
          L.control.zoom({ position: 'topright' }).addTo(map);
        }

        const bounds = L.latLngBounds([]);

        mappedRecords.forEach((item) => {
          bounds.extend([item.coordinates.lat, item.coordinates.lng]);

          const markerRef: { current: LeafletMarker | null } = { current: null };

          const markerElement = createMarkerElement(() => {
            selectItem(item.index);
            markerRef.current?.openPopup();
          });

          const icon = L.divIcon({
            className: 'grdt-leaflet-marker',
            html: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon }).addTo(map);
          markerRef.current = marker;

          const iconEl = marker.getElement();
          if (iconEl) {
            iconEl.style.background = 'transparent';
            iconEl.style.border = 'none';
            iconEl.appendChild(markerElement);
          }

          if (!useFullPopups) {
            marker.on('click', (e: { originalEvent: Event }) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              selectItem(item.index);
            });
          }

          if (useSplitPopups) {
            const args: DataTableMapItemRenderArgs<TRecord, TFilters> = {
              record: item.record,
              index: item.index,
              context,
              coordinates: item.coordinates,
              isActive: item.index === activeIndexRef.current,
              select: () => selectItem(item.index),
              onOpenModal,
            };

            const popupMarkup = getPopupMarkup(config.renderPopup, args, classNames.mapPopup);
            if (popupMarkup) {
              marker.bindPopup(popupMarkup, {
                closeButton: false,
                autoClose: false,
                closeOnClick: false,
                className: classNames.mapPopup,
              });
            }
          }

          if (useFullPopups) {
            const popupEl = document.createElement('div');
            marker.bindPopup(popupEl, {
              className: joinMapClasses('grdt-map-popup', classNames.mapPopup),
              maxWidth: 560,
              minWidth: 220,
              closeButton: true,
              autoClose: true,
              closeOnClick: true,
            });

            marker.on('popupopen', () => {
              selectItem(item.index);
              const root = createRoot(popupEl);
              popupRootsRef.current.set(item.index, root);
              const { renderCard, context: ctx, onOpenModal: openModal, classNames: cn } = latestPopupRef.current;
              const args: DataTableMapItemRenderArgs<TRecord, TFilters> = {
                record: item.record,
                index: item.index,
                context: ctx,
                coordinates: item.coordinates,
                isActive: true,
                select: () => latestPopupRef.current.selectItem(item.index),
                onOpenModal: openModal,
              };
              root.render(<div className={cn.mapCard}>{renderCard(args)}</div>);
            });

            marker.on('popupclose', () => {
              const root = popupRootsRef.current.get(item.index);
              root?.unmount();
              popupRootsRef.current.delete(item.index);
              setActiveIndex((current) => (current === item.index ? null : current));
            });
          }

          markersRef.current.set(item.index, {
            marker,
            element: markerElement,
          });
        });

        if (mappedRecords.length > 1) {
          const pad = config.fitBoundsPadding ?? 72;
          map.fitBounds(bounds, {
            padding: [pad, pad],
            maxZoom: config.initialZoom ?? 13,
          });
        }
      } catch {
        if (!isDisposed) {
          setMapError(labels.errorLoading);
        }
      }
    })();

    return () => {
      isDisposed = true;
      popupRootsRef.current.forEach((root) => {
        try {
          root.unmount();
        } catch {
          // Popup node may already be detached by Leaflet.
        }
      });
      popupRootsRef.current.clear();
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [
    classNames.mapPopup,
    config,
    context,
    labels.errorLoading,
    mappedRecords,
    isBusy,
    isError,
    onOpenModal,
    selectItem,
  ]);

  React.useEffect(() => {
    markersRef.current.forEach((entry, index) => {
      const isActive = index === activeIndex;
      applyMarkerStyles(entry.element, isActive);

      if (layout !== 'split') return;

      const item = mappedRecords.find((m) => m.index === index);
      if (!item) return;

      const popup = entry.marker.getPopup();
      if (!popup) return;

      const args: DataTableMapItemRenderArgs<TRecord, TFilters> = {
        record: item.record,
        index: item.index,
        context,
        coordinates: item.coordinates,
        isActive,
        select: () => selectItem(item.index),
        onOpenModal,
      };

      const popupMarkup = getPopupMarkup(config.renderPopup, args, classNames.mapPopup);
      if (popupMarkup) {
        entry.marker.setPopupContent(popupMarkup);
      }
      if (isActive) {
        entry.marker.openPopup();
      } else {
        entry.marker.closePopup();
      }
    });

    if (activeIndex == null || !mapRef.current) return;
    const selected = mappedRecords.find((item) => item.index === activeIndex);
    if (!selected) return;
    mapRef.current.flyTo(
      [selected.coordinates.lat, selected.coordinates.lng],
      Math.max(mapRef.current.getZoom(), config.initialZoom ?? 12),
      { animate: true }
    );
  }, [activeIndex, classNames.mapPopup, config, context, layout, mappedRecords, onOpenModal, selectItem]);

  /** Re-render open Leaflet popups (full layout) when table context or card renderer changes. */
  React.useEffect(() => {
    if (layout !== 'full') return;
    markersRef.current.forEach((entry, index) => {
      if (!entry.marker.isPopupOpen()) return;
      const item = mappedRecords.find((m) => m.index === index);
      if (!item) return;
      const root = popupRootsRef.current.get(index);
      if (!root) return;
      const args: DataTableMapItemRenderArgs<TRecord, TFilters> = {
        record: item.record,
        index: item.index,
        context,
        coordinates: item.coordinates,
        isActive: true,
        select: () => selectItem(item.index),
        onOpenModal,
      };
      root.render(<div className={classNames.mapCard}>{config.renderCard(args)}</div>);
    });
  }, [layout, mappedRecords, context, config.renderCard, classNames.mapCard, onOpenModal, selectItem]);

  const rootClass = joinMapClasses(
    classNames.mapViewRoot,
    layout === 'split' ? classNames.mapViewSplitGrid : ''
  );

  const showMapCanvas = !isBusy && !isError && mappedRecords.length > 0 && !mapError;

  return (
    <div className={rootClass} data-genesis-map-layout={layout}>
      {layout === 'full' && showMapCanvas ? (
        <div className={classNames.mapFloatingBar}>
          <span className="min-w-0 flex-1 truncate">{config.sidebarTitle ?? labels.mapResults}</span>
          <span
            className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700"
            aria-label={labels.mapResults}
          >
            {mappedRecords.length}
          </span>
        </div>
      ) : null}

      {layout === 'split' ? (
        <div className={classNames.mapSidebar}>
          <div className={classNames.mapSidebarHeader}>
            <span>{config.sidebarTitle ?? labels.mapResults}</span>
            <span>{mappedRecords.length}</span>
          </div>
          {isBusy ? (
            <div className={classNames.mapSidebarList}>
              {Array.from({ length: skeletonRows }).map((_, index) => (
                <div key={index} className={classNames.mapCard}>
                  <div style={{ height: '14px', width: '60%', borderRadius: '999px', background: '#e2e8f0' }} />
                  <div
                    style={{
                      height: '12px',
                      width: '85%',
                      borderRadius: '999px',
                      background: '#e2e8f0',
                      marginTop: '12px',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className={classNames.mapEmptyState}>{labels.errorLoading}</div>
          ) : mappedRecords.length === 0 ? (
            <div className={classNames.mapEmptyState}>{labels.mapNoCoordinates}</div>
          ) : (
            <div className={classNames.mapSidebarList}>
              {mappedRecords.map((item) => {
                const isActive = item.index === activeIndex;
                const args: DataTableMapItemRenderArgs<TRecord, TFilters> = {
                  record: item.record,
                  index: item.index,
                  context,
                  coordinates: item.coordinates,
                  isActive,
                  select: () => selectItem(item.index),
                  onOpenModal,
                };
                return (
                  <button
                    key={item.index}
                    ref={(element) => {
                      cardRefs.current.set(item.index, element);
                    }}
                    type="button"
                    className={joinMapClasses(
                      classNames.mapCard,
                      isActive ? classNames.mapCardActive : ''
                    )}
                    onClick={() => selectItem(item.index)}
                  >
                    {config.renderCard(args)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div className={classNames.mapCanvasShell}>
        {isBusy ? (
          <div className={classNames.mapEmptyState}>Loading map...</div>
        ) : isError ? (
          <div className={classNames.mapEmptyState}>{labels.errorLoading}</div>
        ) : mappedRecords.length === 0 ? (
          <div className={classNames.mapEmptyState}>{labels.mapNoCoordinates}</div>
        ) : mapError ? (
          <div className={classNames.mapEmptyState}>{mapError}</div>
        ) : null}
        <div
          ref={mapContainerRef}
          className={classNames.mapCanvas}
          style={showMapCanvas ? undefined : { display: 'none' }}
        />
      </div>
    </div>
  );
}
