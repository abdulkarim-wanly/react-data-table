# genesis-react-data-table

Configurable **React** data table built on [**TanStack Table**](https://tanstack.com/table) v8 and [**TanStack Query**](https://tanstack.com/query) v5. Includes search, pagination, sorting, toolbar actions, row actions, optional custom filter UI, built-in **table / grid / list / map** view modes, and **full TypeScript** generics for row and filter types.

## Requirements

- **React** ≥ 18  
- **Peer dependencies** (install explicitly in your app):

| Package | Notes |
|--------|--------|
| `react` / `react-dom` | >= 18 |
| `@tanstack/react-query` | v5 - wrap your app in `QueryClientProvider` |
| `@tanstack/react-table` | v8 |
| `react-i18next` | >= 11 (e.g. 15.x is supported) + `i18next` |
| `lucide-react` | >= 0.400 - icons used by the built-in search UI |
| `leaflet` | v1.9 when you use the built-in map view |

## Installation

### From GitHub (SSH or HTTPS) — no npm registry

Push this repo to GitHub, then in your **app** install it by URL. npm will clone the repo, install this package’s devDependencies, run the **`prepare`** script (which runs **`build`**), and place the built **`dist/`** in `node_modules`.

**SSH** (common for private repos; requires your SSH key on GitHub):

```bash
npm install git+ssh://git@github.com:YOUR_ORG/YOUR_REPO.git
```

Pin a **branch** (default is often `main`):

```bash
npm install git+ssh://git@github.com:YOUR_ORG/YOUR_REPO.git#main
```

Pin a **tag** or **commit**:

```bash
npm install git+ssh://git@github.com:YOUR_ORG/YOUR_REPO.git#v0.1.3
npm install git+ssh://git@github.com:YOUR_ORG/YOUR_REPO.git#abc1234
```

**HTTPS** (works for public repos; private repos need a token):

```bash
npm install git+https://github.com/YOUR_ORG/YOUR_REPO.git
```

Then add **peer dependencies** in the same project (npm does not always install peers for git deps):

```bash
npm install @tanstack/react-query @tanstack/react-table react-i18next i18next lucide-react leaflet
```

**Note:** The repo is set up so **`dist/`** is not required in Git — the first install runs **`npm run build`** via **`prepare`**. If you prefer faster installs and no build on the consumer machine, you can commit **`dist/`** and remove **`dist/`** from **`.gitignore`** (optional).

**`package.json` in your app:**

```json
{
  "dependencies": {
    "genesis-react-data-table": "git+ssh://git@github.com:YOUR_ORG/YOUR_REPO.git#main"
  }
}
```

### From the npm registry (optional)

```bash
npm install genesis-react-data-table @tanstack/react-query @tanstack/react-table react-i18next i18next lucide-react leaflet
```

If npm reports peer conflicts, align versions with the table above, or use `npm install --legacy-peer-deps` only as a last resort.

## App setup

### 1. React Query

`DataTable` uses `useQuery` internally. Provide a client at the root (or above any `DataTable`):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### 2. i18next (if you use `searchFields`)

`SearchInput` calls `useTranslation()` and expects these keys unless you only rely on a custom flow:

| Key | Typical use |
|-----|-------------|
| `home.table.search` | Default placeholder when no `searchFields` |
| `home.table.searchPlaceholder` | Placeholder with `{{fields}}` when `searchFields` is set |
| `home.table.clearSearch` | Clear button `aria-label` |

Minimal `i18next` + `react-i18next` init:

```tsx
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en",
  resources: {
    en: {
      translation: {
        home: {
          table: {
            search: "Search…",
            searchPlaceholder: "Search in {{fields}}",
            clearSearch: "Clear search",
          },
        },
      },
    },
  },
});

// Root:
<I18nextProvider i18n={i18n}>{/* app */}</I18nextProvider>
```

If you do **not** set `config.searchFields`, you can skip some keys; still provide `I18nextProvider` if any child uses `SearchInput`.

### 3. Styling (Tailwind)

The table ships with **plain defaults** (`DEFAULT_DATA_TABLE_CLASSNAMES`). Override only what you need via **`config.classNames`**, or swap whole regions with **`config.layoutComponents`**.

**`config.classNames`** — partial map of regions (root, `headerCard`, `tableOuter`, `tableScroll`, chrome toolbar tokens such as `tableBlock`, `toolbarShell`, `toolbarDropdownMenuContent`, `toolbarDropdownMenuItem`, `toolbarSearchFiltersCluster`, `toolbarFiltersBeside`, `tableOuterChrome`, legacy `viewModeToggle` / `viewModeButton`, map regions, pagination, etc.). Import **`DEFAULT_DATA_TABLE_CLASSNAMES`** or **`mergeDataTableClassNames`** if you want to extend defaults in code.

**`config.labels`** — strings for error/empty/pagination, view mode labels, toolbar copy (`toolbarView`, `toolbarRefresh`; legacy keys like `toolbarSort` / `toolbarResetFilters` remain on **`DataTableLabels`** for i18n bundles but are unused by the chrome toolbar), map strings (`mapResults`, `mapNoCoordinates`), and more. Default is English; pass values from **`t('…')`** if you use i18n.

**`config.layoutComponents`** — optional **`PageHeader`**, **`Toolbar`**, **`TableShell`** components. Each receives **`classNames`** (the merged tokens for that region) and **`children`** (toolbar/shell). Use these when you need a **glass card**, sticky header chrome, or a **`PageHeader`** that matches the rest of your app.

Example: glass shell + fixed scroll height (Tailwind classes only):

```tsx
import {
  DataTable,
  type DataTableConfig,
  DEFAULT_DATA_TABLE_CLASSNAMES,
} from "genesis-react-data-table";

const glassTableClasses = {
  ...DEFAULT_DATA_TABLE_CLASSNAMES,
  root: "flex flex-col gap-4 w-full max-w-full overflow-x-hidden",
  headerCard:
    "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full glass glass-2 glass-highlight rounded-2xl p-4 md:p-5",
  tableOuter: "glass glass-3 rounded-2xl overflow-hidden w-full max-w-full max-h-[410px] flex flex-col min-h-0",
  tableScroll:
    "bg-background/45 dark:bg-background/30 h-[410px] min-h-0 overflow-auto w-full",
  tableHeader: "h-16 sticky top-0 z-10 backdrop-blur bg-background/70 dark:bg-background/50",
};

const config: DataTableConfig<Row> = {
  /* … */
  classNames: glassTableClasses,
};
```

Example: custom **`PageHeader`** (your design system component):

```tsx
import type { DataTablePageHeaderSlotProps } from "genesis-react-data-table";

function PageHeader({ title, subtitle, rightSlot, classNames }: DataTablePageHeaderSlotProps) {
  return (
    <div className={classNames.headerCard}>
      <div>
        {title && <h2 className={classNames.pageTitle}>{title}</h2>}
        {subtitle && <p className={classNames.pageSubtitle}>{subtitle}</p>}
      </div>
      {rightSlot && <div className={classNames.actionsWrapper}>{rightSlot}</div>}
    </div>
  );
}

<DataTable config={{ ...config, layoutComponents: { PageHeader } }} />;
```

`PageHeader` receives **`rightSlot`** as the raw **`ActionButtonsBar`**. When you omit **`layoutComponents.PageHeader`**, `DataTable` uses the exported **`DataTablePageHeader`**, which wraps **`rightSlot`** in **`actionsWrapper`** (same layout as the snippet above).

**Standalone page header** — use the same block on non-table pages:

```tsx
import { DataTablePageHeader, mergeDataTableClassNames } from "genesis-react-data-table";

const c = mergeDataTableClassNames({
  headerCard: "flex flex-row items-start justify-between gap-4 w-full",
});

export function SettingsHeader() {
  return (
    <DataTablePageHeader
      title="Settings"
      subtitle="Manage your account"
      rightSlot={<button type="button">Save</button>}
      classNames={c}
    />
  );
}
```

**Chrome toolbar (default)** — With **`config.chromeToolbar !== false`** (the default), **`filtersUI`** / **`renderFilters`** output is shown **in the same toolbar row as the search field** (hosted **`InlineFiltersUI`** / your render). **View** uses the built-in dropdown that shows the active mode in the trigger; **Refresh** refetches data. There is **no** toolbar sort menu or **Reset filters** button on the bar (use your filter UI or **`context.resetFilters`**). The chrome sits above the table inside **`tableBlock`**. Set **`chromeToolbar: false`** for the legacy light filters row and outline view buttons.

---

## Quick start

```tsx
import {
  DataTable,
  type DataTableConfig,
  type ServiceQuery,
  type ServiceResult,
} from "genesis-react-data-table";

type Row = { id: string; name: string };

const config: DataTableConfig<Row> = {
  service: {
    getAll: async (query: ServiceQuery): Promise<ServiceResult<Row>> => {
      // query.page, query.perPage, query.sorting, query.filters
      return {
        data: [],
        meta: { total: 0, page: query.page, perPage: query.perPage },
      };
    },
  },
  columns: [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
  ],
};

export function ExamplePage() {
  return <DataTable config={config} />;
}
```

### Typed filters (optional second generic)

Define optional filter fields so `query.filters` and `DataTableActionsContext` stay typed:

```tsx
type Row = { id: string };
type Filters = { status?: string; region?: string };

const config: DataTableConfig<Row, Filters> = {
  service: {
    getAll: async (query) => {
      const status = query.filters.status;
      return { data: [], meta: { total: 0, page: 1, perPage: 10 } };
    },
  },
  columns: [{ accessorKey: "id", header: "ID" }],
};

<DataTable<Row, Filters> config={config} />;
```

`query.filters` is a **`MergedTableFilters<TFilters>`**: your fields plus optional **`search`** / **`searchFields`** when the built-in search bar is enabled.

### Leaflet CSS (map view)

If you use the built-in **map** view, import Leaflet’s CSS once in your app bootstrap (for correct tiles, zoom controls, and map panes):

```ts
import "leaflet/dist/leaflet.css";
```

The default tiles are **OpenStreetMap**; no API key is required. Follow the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) for production traffic (attribution is included by default). Heavy or hotlinked traffic may see blocked tiles; use your own tile proxy or set `views.map.tileLayerUrl` / `tileAttribution` to a provider you are entitled to use.

---

## `DataTable` config reference

| Property | Description |
|----------|-------------|
| `service.getAll` | **Required.** `(query: ServiceQuery<TFilters>) => Promise<ServiceResult<TRecord>>` |
| `columns` | TanStack **`ColumnDef<TRecord>[]`**; you may use **`sortable?: boolean`** (alias for `enableSorting`) |
| `rowActions` | **`RowAction<TRecord, TFilters>[]`** rendered by `DataTable` as a built-in trailing actions column when an actions column is not already present |
| `autoRowActionsColumn` | Defaults to `true`; set `false` if you already render row actions in your own table column |
| `actions` | **`TableAction<TRecord, TFilters>[]`** for toolbar buttons |
| `views` | Optional built-in view mode config for `table`, `grid`, `list`, and `map` |
| `views.map` | Map mode: `getCoordinates`, `renderCard` (Leaflet popup in `full`, sidebar/list in `split`), optional `layout`, `renderPopup` (split static HTML only), tiles, zoom, `sidebarTitle`, etc. |
| `id` | Stable table id (default `"table"`); used in modal registry keys |
| `queryKey` | Extra React Query key prefix; defaults to `[id]` |
| `defaultPerPage` | Page size (default `10`) |
| `searchFields` | Field names merged into `filters` for server search |
| `pageHeader` | `{ title?, subtitle? }` |
| `filtersUI` | Inline filters slot. Used when **`renderFilters`** is omitted. Passed to **`InlineFiltersUI`**: a function **`(context) => ReactNode`**, or an object with **`render`**, or **`Component`** + **`formConfig`** / **`onApply`**. See below. |
| `renderFilters` | Optional override for the whole filters region. If set, **`filtersUI`** is not used for that slot. |
| `onOpenModal` | `(type, props) => void` when actions use **`openModal`** |
| `onRegisterModal` | Receives a map of modal handler ids |
| `onUrlAction` | Runs **once** on mount with **`config`** and **`context`** |
| `staleTime` / `gcTime` / `refetchOnWindowFocus` | Passed to **`useQuery`** |
| `skeletonRows` | Loading placeholder row count |
| `classNames` | Partial **`DataTableClassNames`** — Tailwind (or any) classes per layout region; see **Styling** above |
| `labels` | Partial **`DataTableLabels`** — error/empty/pagination copy |
| `layoutComponents` | Optional **`PageHeader`**, **`Toolbar`**, **`TableShell`** to replace default layout wrappers |
| `chromeToolbar` | Default **`true`**: professional chrome toolbar (search, **View** dropdown, refresh) with **filters beside search** when `filtersUI` / `renderFilters` is set. Uses the built-in dropdown implementation. Set **`false`** for the legacy filters row and outline view buttons |

### Pagination and `meta`

After the first successful load (and while not in an error state), the table shows a **pagination row** below the grid: **Page X**, and when **`meta.total`** is set also **of Y**, plus a short summary (**`labels.showingRange`** with `{{start}}`, `{{end}}`, `{{total}}`, or **`labels.emptyDataset`** when the total is zero). If **`total`** is omitted, the summary uses **`labels.rowsThisPage`** (`{{count}} on this page`) and **“of Y”** is hidden.

**Previous** is disabled when there is nowhere to go back (`page === 1` unless **`meta.hasPrevious`** is set). **Next** is disabled when **`page >= totalPages`** if **`total`** was provided; otherwise **`meta.hasNext`** is used when present, or a small heuristic (full page of rows ⇒ maybe another page).

For predictable behaviour on the last page and when there is only one page, return **`meta.total`** from **`getAll`** (and optionally echo **`perPage`**). Cursor-style APIs can omit **`total`** and set **`hasNext`** / **`hasPrevious`** instead.

You can return both **`total`** and **`hasNext`** (e.g. `meta: { total, page, perPage, start, next, hasNext }`). When **`hasNext`** is present, the **Next** button uses it instead of inferring from **`total`**, so the server stays authoritative. **`start`** and **`next`** are typed on **`DataTableQueryMeta`** and appear on **`context.meta`** for custom actions or future cursor-based paging.

---

### `filtersUI` shapes (no `renderFilters` needed)

1. **Function** — same as a tiny `renderFilters` scoped to the default slot:

   ```tsx
   filtersUI: (ctx) => <MyFilters onApply={(v) => ctx.applyFilters(v)} />,
   ```

2. **Object with `render`** — receives `context`, `filters`, `applyFilters`, `resetFilters`:

   ```tsx
   filtersUI: {
     render: ({ context }) => <MyFilters onApply={(v) => context.applyFilters(v)} />,
   },
   ```

3. **Object with only `formConfig` + `onApply`** (e.g. grid layout, Bitrix `request` / `mapOptions` fields) — the package does not ship your dynamic form. Register **one** host component for the whole app:

   **`main.tsx` / app bootstrap (once):**

   ```tsx
   import { setDefaultDataTableFiltersHost } from "genesis-react-data-table/setup";
   import { UnitDealsFiltersHost } from "@/components/filters/UnitDealsFiltersHost";

   setDefaultDataTableFiltersHost(UnitDealsFiltersHost);
   ```

   (`genesis-react-data-table/setup` avoids Vite pre-bundle issues; the same export exists on the package root.)

   **`UnitDealsFiltersHost`** implements **`DataTableFiltersUIHostProps`**: it receives **`formConfig`** (the object returned by your `formConfig()`), **`onApply(values)`**, **`context`**, and **`filtersUI`** (the full config bag). Inside, render your existing dynamic form (the same one you used with the old table).

   **Per-table config** stays as you already have it:

   ```tsx
   filtersUI: {
     formConfig: () => ({ id: "deals-filters", layout: { type: "grid", columns: 3 }, fields: [...] }),
     onApply: ({ values, context }) => context.applyFilters(cleanFilters(values)),
   },
   ```

4. **Object with `Component`** — same as (3) but **per table**, overriding the default host:

   ```tsx
   filtersUI: {
     formConfig: () => ({ ... }),
     onApply: ({ values, context }) => context.applyFilters(clean(values)),
     Component: OtherTableFiltersHost,
   },
   ```

If you never call **`setDefaultDataTableFiltersHost`** and omit **`Component`**, a bag with only **`formConfig` + `onApply`** renders nothing.

---

## `DataTableActionsContext` (for actions, `filtersUI`, and `renderFilters`)

Exposed on toolbar actions, row actions, **`filtersUI`**, and **`renderFilters`**:

- **`refetch`**, **`refresh`**, **`isFetching`**
- **`page`**, **`perPage`**, **`setPage`**, **`setPerPage`**
- **`viewMode`**, **`setViewMode`**
- **`sorting`**, **`setSorting`**
- **`filters`**, **`setFilters`**, **`applyFilters`**, **`resetFilters`**
- **`setSearchValue`** (wired to internal search state)
- **`rows`** — current page data: **`TRecord[]`**
- **`meta`** — last **`ServiceResult`** meta or **`undefined`**

---

## View modes

`DataTable` supports four built-in display modes:

- **`table`** — the default column-based layout
- **`grid`** — card/grid layout driven by your `renderGridItem`
- **`list`** — stacked list layout driven by your `renderListItem`
- **`map`** — interactive map (Leaflet + OpenStreetMap by default). **Default `layout` is `full`:** map fills the container width, markers per row, **`renderCard` is shown inside a Leaflet marker popup** (interactive React, same API as grid/list cards). Set `views.map.layout: "split"` for the legacy sidebar list + map.

Grid, list, and map are intentionally renderer-driven because the library cannot safely guess how your record should appear outside the tabular column model.

```tsx
import { DataTable, type DataTableConfig } from "genesis-react-data-table";

type Row = { id: string; name: string; email: string };

const config: DataTableConfig<Row> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
  ],
  views: {
    modes: ["table", "grid", "list", "map"],
    defaultMode: "table",
    persistMode: true,
    renderGridItem: ({ record }) => (
      <article className="rounded-xl border p-4">
        <h3 className="font-semibold">{record.name}</h3>
        <p className="text-sm text-muted-foreground">{record.email}</p>
      </article>
    ),
    renderListItem: ({ record }) => (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <span>{record.name}</span>
        <span className="text-sm text-muted-foreground">{record.email}</span>
      </div>
    ),
    map: {
      getCoordinates: (record) => ({ lat: record.lat, lng: record.lng }),
      renderCard: ({ record, isActive }) => (
        <article className={isActive ? "rounded-xl border border-blue-400 p-4" : "rounded-xl border p-4"}>
          <h3 className="font-semibold">{record.name}</h3>
          <p className="text-sm text-muted-foreground">{record.email}</p>
        </article>
      ),
    },
  },
};
```

Notes:

- Include `grid` in `views.modes` only when `renderGridItem` is provided.
- Include `list` in `views.modes` only when `renderListItem` is provided.
- Include `map` in `views.modes` only when `views.map` includes `getCoordinates` and `renderCard`.
- The built-in toggle appears automatically when more than one valid mode is available.
- The user's last chosen view mode is persisted in `localStorage` by default using the table id.
- Disable persistence with `views.persistMode = false`, or override the storage key with `views.storageKey`.
- Customize toggle labels through `config.labels.viewAsTable`, `config.labels.viewAsGrid`, `config.labels.viewAsList`, and `config.labels.viewAsMap`.
- Map-specific copy: `config.labels.mapResults`, `config.labels.mapNoCoordinates`.

### Map view details

#### Layout: `full` (default)

- The **map spans the full width of the table container** (no sidebar list).
- A compact **floating bar** shows `sidebarTitle` (or `labels.mapResults`) and the count of rows with valid coordinates.
- **Markers** are drawn for every row where `getCoordinates` returns finite `lat` / `lng`.
- **Clicking a marker** opens a **Leaflet popup** attached to that marker. The popup body is your **`renderCard`** output, mounted with **`react-dom/client`** so it stays **fully interactive** (same **`DataTableMapItemRenderArgs`** as grid/list: `record`, `context`, `isActive`, `select`, `onOpenModal`, …). Leaflet’s popup close button and clicking elsewhere on the map dismiss it (standard Leaflet behavior).
- Style the popup shell with **`classNames.mapPopup`** (merged with an internal `grdt-map-popup` class). The card wrapper inside uses **`classNames.mapCard`**.
- The map container sets **`data-genesis-map-layout="full"`** for styling or tests.

#### Layout: `split` (legacy)

- **Left:** scrollable list; each row is a button wrapping **`renderCard`** (synced with the active marker).
- **Right:** the same Leaflet map and markers.
- Optional **`renderPopup`** still renders **static HTML** inside a Leaflet popup (via `renderToStaticMarkup`). Prefer **`renderCard`** for rich UI; use `renderPopup` only for simple text/HTML in split mode.

```tsx
views: {
  modes: ["table", "map"],
  map: {
    // layout: "full" — default; omit or set layout: "split" for sidebar + map
    getCoordinates: (record) => ({ lat: record.lat, lng: record.lng }),
    renderCard: ({ record, context }) => (
      <article className="rounded-xl border p-4">
        <h3 className="font-semibold">{record.name}</h3>
        <p className="text-sm text-muted-foreground">{record.city}</p>
      </article>
    ),
    sidebarTitle: "Property locations",
    initialZoom: 10,
    fitBoundsPadding: 72,
    showNavigation: true,
    // Split only — optional simple popup HTML:
    // renderPopup: ({ record }) => <div>{record.name}</div>,
  },
}
```

**Styling** — override defaults with `config.classNames` / `mergeDataTableClassNames`, for example:

- `mapViewRoot` — outer wrapper (`relative w-full` by default; in split mode, `mapViewSplitGrid` adds the two-column grid).
- `mapFloatingBar` — full-layout title/count chip over the map.
- `mapDetailPanel`, `mapDetailClose` — reserved class tokens (unused in the default full layout; safe to ignore or reuse in your theme).
- `mapSidebar`, `mapSidebarHeader`, `mapSidebarList`, `mapCard`, `mapCardActive` — split layout only.
- `mapCanvasShell`, `mapCanvas`, `mapEmptyState`, `mapPopup` — map surface, empty states, Leaflet popup wrapper class (**full** layout popups + split when using `renderPopup`).

Notes:

- Rows without valid coordinates are skipped for markers (and for the count in the floating bar).
- In **split** mode, sidebar selection, marker selection, and optional popups stay in sync.
- The map view persists like the other view modes when `persistMode !== false`.

---

## Row actions and `UserActionCell`

When you pass **`config.rowActions`**, `DataTable` appends a built-in trailing **Actions** column automatically when your `columns` array does not already contain an obvious actions column. Override the header text with **`config.labels?.actionsColumn`**.

If your existing table already renders actions through a custom column cell, set **`config.autoRowActionsColumn = false`** to avoid duplicate **Actions** columns in table view.

Use **`UserActionCell`** inside a column cell when you need the same row actions as **`config.rowActions`**:

```tsx
import { UserActionCell, type RowAction } from "genesis-react-data-table";

// Pass the same TRecord / TFilters as DataTable.
// You need table `context` from your page (e.g. lifted state, or render prop pattern).
```

Wire **`onOpenModal`** on **`DataTable`** if actions return **`openModal`** payloads.

---

## Exports

**Components:** `DataTable`, `DataTablePageHeader`, `DataTableToolbar`, `ActionButtonsBar`, `UserActionCell`, `SearchInput`, `InlineFiltersUI`, `componentCell` (column helper).

**Registration:** `setDefaultDataTableFiltersHost` from **`genesis-react-data-table`** or **`genesis-react-data-table/setup`** — see **`filtersUI`** and **Vite** sections above.

**Types:** `DataTableConfig`, `DataTableProps`, `DataTableViewsConfig`, `DataTableActionsContext`, `DataTableColumnDef`, `DataTableFiltersUIHostProps`, `DataTableFiltersUISlot`, `DataTableViewMode`, `DataTableViewRendererArgs`, `DataTableMapCoordinates`, `DataTableMapItemRenderArgs`, `DataTableMapViewConfig`, `ServiceQuery`, `ServiceResult`, …

**Util:** `isModalPayload` (for custom modal flows).

---

## Vite: `does not provide an export named 'setDefaultDataTableFiltersHost'`

Usually a **stale dependency pre-bundle**. Try:

1. Stop the dev server.
2. Delete **`node_modules/.vite`** (and optionally **`node_modules/genesis-react-data-table`**).
3. Reinstall the library (`npm install` / update your git ref), then **`npm run dev`** again.

**Or** import the bootstrap API from the dedicated subpath (always a small, explicit export):

```ts
import { setDefaultDataTableFiltersHost } from "genesis-react-data-table/setup";
```

If it still fails, add to **`vite.config.ts`**:

```ts
export default defineConfig({
  optimizeDeps: {
    exclude: ["genesis-react-data-table"],
  },
});
```

---

## TypeScript in consumer projects

Use **`moduleResolution`: `"bundler"`** (or **`"node16"`** / **`"nodenext"`**) in your app `tsconfig` so dependencies with **`exports`** (e.g. TanStack packages) resolve typings correctly.

---

## Development (library repo)

```bash
npm install
npm run build
npm test
```

- **`prepare`** runs **`build`** after `npm install` in this repo and when the package is **installed from a Git URL**, so consumers get a compiled **`dist/`** without publishing to npm.
- **`prepublishOnly`** runs **`build`** before **`npm publish`** (if you ever use the registry).

## License

MIT — see `LICENSE`.
