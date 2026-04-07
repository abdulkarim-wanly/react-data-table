import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

function createMarkerElement(onSelect: () => void): HTMLButtonElement {
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
    onSelect();
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
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markersRef = React.useRef<Map<number, MarkerEntry>>(new Map());
  const cardRefs = React.useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const activeIndexRef = React.useRef<number | null>(null);
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

  const [activeIndex, setActiveIndex] = React.useState<number | null>(mappedRecords[0]?.index ?? null);

  activeIndexRef.current = activeIndex;

  React.useEffect(() => {
    if (mappedRecords.some((item) => item.index === activeIndex)) return;
    setActiveIndex(mappedRecords[0]?.index ?? null);
  }, [mappedRecords, activeIndex]);

  React.useEffect(() => {
    if (activeIndex == null) return;
    const card = cardRefs.current.get(activeIndex);
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  const selectItem = React.useCallback((index: number) => setActiveIndex(index), []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    if (mappedRecords.length === 0 || isBusy || isError) return;

    let isDisposed = false;

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

          const markerElement = createMarkerElement(() => selectItem(item.index));

          const icon = L.divIcon({
            className: 'grdt-leaflet-marker',
            html: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon }).addTo(map);

          const iconEl = marker.getElement();
          if (iconEl) {
            iconEl.style.background = 'transparent';
            iconEl.style.border = 'none';
            iconEl.appendChild(markerElement);
          }

          marker.on('click', () => {
            selectItem(item.index);
          });

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
  }, [activeIndex, classNames.mapPopup, config, context, mappedRecords, onOpenModal, selectItem]);

  return (
    <div className={classNames.mapViewRoot}>
      <div className={classNames.mapSidebar}>
        <div className={classNames.mapSidebarHeader}>
          <span>{config.sidebarTitle ?? labels.mapResults}</span>
          <span>{mappedRecords.length}</span>
        </div>
        {isBusy ? (
          <div className={classNames.mapSidebarList}>
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <div key={index} className={classNames.mapCard}>
                <div style={{ height: "14px", width: "60%", borderRadius: "999px", background: "#e2e8f0" }} />
                <div
                  style={{
                    height: "12px",
                    width: "85%",
                    borderRadius: "999px",
                    background: "#e2e8f0",
                    marginTop: "12px",
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
                  className={`${classNames.mapCard} ${isActive ? classNames.mapCardActive : ''}`.trim()}
                  onClick={() => selectItem(item.index)}
                >
                  {config.renderCard(args)}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
          style={
            mappedRecords.length === 0 || mapError || isBusy || isError
              ? { display: "none" }
              : undefined
          }
        />
      </div>
    </div>
  );
}
