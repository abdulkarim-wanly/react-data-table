import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Map as MapboxMap, Marker as MapboxMarker, Popup as MapboxPopup } from 'mapbox-gl';

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
  marker: MapboxMarker;
  element: HTMLButtonElement;
  popup?: MapboxPopup;
};

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
  const mapRef = React.useRef<MapboxMap | null>(null);
  const markersRef = React.useRef<Map<number, MarkerEntry>>(new Map());
  const cardRefs = React.useRef<Map<number, HTMLButtonElement | null>>(new Map());
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
        const mapboxModule = await import('mapbox-gl');
        const mapboxgl = 'default' in mapboxModule ? mapboxModule.default : mapboxModule;
        if (isDisposed || !mapContainerRef.current) return;

        mapboxgl.accessToken = config.accessToken;

        const initialCenter =
          config.initialCenter ?? [mappedRecords[0].coordinates.lng, mappedRecords[0].coordinates.lat];
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: config.mapStyle ?? 'mapbox://styles/mapbox/standard',
          center: initialCenter,
          zoom: config.initialZoom ?? (mappedRecords.length > 1 ? 9 : 12),
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
        });

        mapRef.current = map;

        map.on('error', () => {
          setMapError(labels.errorLoading);
        });

        if (config.showNavigation !== false) {
          map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        }

        const bounds = new mapboxgl.LngLatBounds();

        mappedRecords.forEach((item) => {
          bounds.extend([item.coordinates.lng, item.coordinates.lat]);

          const markerElement = createMarkerElement(() => selectItem(item.index));
          const marker = new mapboxgl.Marker({ element: markerElement, anchor: 'center' })
            .setLngLat([item.coordinates.lng, item.coordinates.lat])
            .addTo(map);

          const args: DataTableMapItemRenderArgs<TRecord, TFilters> = {
            record: item.record,
            index: item.index,
            context,
            coordinates: item.coordinates,
            isActive: item.index === activeIndex,
            select: () => selectItem(item.index),
            onOpenModal,
          };

          const popupMarkup = getPopupMarkup(config.renderPopup, args, classNames.mapPopup);
          let popup: MapboxPopup | undefined;
          if (popupMarkup) {
            popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 16,
            }).setHTML(popupMarkup);
            marker.setPopup(popup);
          }

          marker.getElement().addEventListener('click', () => {
            selectItem(item.index);
            if (popup && !popup.isOpen()) {
              popup.addTo(map);
            }
          });

          markersRef.current.set(item.index, {
            marker,
            element: markerElement,
            popup,
          });
        });

        if (mappedRecords.length > 1) {
          map.fitBounds(bounds, {
            padding: config.fitBoundsPadding ?? 72,
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
    activeIndex,
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
      if (!entry.popup) return;
      if (isActive) {
        if (!entry.popup.isOpen()) {
          entry.popup.addTo(mapRef.current!);
        }
      } else if (entry.popup.isOpen()) {
        entry.popup.remove();
      }
    });

    if (activeIndex == null || !mapRef.current) return;
    const selected = mappedRecords.find((item) => item.index === activeIndex);
    if (!selected) return;
    mapRef.current.flyTo({
      center: [selected.coordinates.lng, selected.coordinates.lat],
      zoom: Math.max(mapRef.current.getZoom(), config.initialZoom ?? 12),
      essential: true,
    });
  }, [activeIndex, config.initialZoom, mappedRecords]);

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
