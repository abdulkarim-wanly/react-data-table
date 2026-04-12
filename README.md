# genesis-react-data-table

A configurable React data table built on TanStack Table and TanStack Query.

It is designed for server-side data fetching with a typed `service.getAll` API, built-in search, pagination, optional column sorting (`enableSorting: true`), toolbar actions, row actions, and optional `table`, `grid`, `list`, and `map` view modes.

## What It Includes

- Typed `DataTable<TRecord, TFilters>` API
- Server-side pagination, optional sorting, and filter flow
- Built-in search input
- Toolbar actions and row actions
- Optional grid, list, and map views
- Layout and class-name overrides
- React Query integration
- TypeScript exports for app-level composition

## Documentation

- Discovery and setup: `README.md`
- Practical examples: [USAGE.md](./USAGE.md)

## Installation

Install the package and its peer dependencies in your app:

```bash
npm install genesis-react-data-table
npm install react react-dom @tanstack/react-query @tanstack/react-table react-i18next i18next lucide-react leaflet
```

If you consume the package directly from Git:

```bash
npm install git+ssh://git@github.com:YOUR_ORG/YOUR_REPO.git#main
```

## Requirements

| Package | Version | Notes |
| --- | --- | --- |
| `react` / `react-dom` | `>= 18` | |
| `@tanstack/react-query` | `^5` | required |
| `@tanstack/react-table` | `^8` | required |
| `react-i18next` | `>= 11` | used by the built-in `SearchInput` |
| `lucide-react` | `>= 0.400.0` | for action icons |
| `leaflet` | `^1.9` | map view only |

## Required App Setup

### React Query

`DataTable` uses `useQuery` internally, so your app must provide a `QueryClientProvider`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### i18n

The built-in search input uses `react-i18next`. If you use `searchFields` or the default search UI, wrap your app in `I18nextProvider`.

Expected translation keys:

- `home.table.search`
- `home.table.searchPlaceholder`
- `home.table.clearSearch`

Minimal setup:

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
            search: "Search...",
            searchPlaceholder: "Search in {{fields}}",
            clearSearch: "Clear search",
          },
        },
      },
    },
  },
});

export function I18nProviders({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```

### Leaflet CSS

Import Leaflet CSS once if you enable map view:

```ts
import "leaflet/dist/leaflet.css";
```

## Quick Start

```tsx
import {
  DataTable,
  type DataTableConfig,
  type ServiceQuery,
  type ServiceResult,
} from "genesis-react-data-table";

type User = {
  id: string;
  name: string;
  email: string;
};

const config: DataTableConfig<User> = {
  enableSorting: true,
  service: {
    getAll: async (query: ServiceQuery): Promise<ServiceResult<User>> => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      return response.json();
    },
  },
  columns: [
    { accessorKey: "name", header: "Name", sortable: true },
    { accessorKey: "email", header: "Email" },
  ],
  pageHeader: {
    title: "Users",
    subtitle: "Browse and manage users",
  },
  searchFields: ["name", "email"],
};

export function UsersPage() {
  return <DataTable config={config} />;
}
```

The `service.getAll` callback receives:

```ts
type ServiceQuery<TFilters> = {
  page: number;
  perPage: number;
  sorting: SortingState;
  filters: TFilters & {
    search?: string;
    searchFields?: string[];
  };
};
```

It must return:

```ts
type ServiceResult<TRecord> = {
  data: TRecord[];
  meta: {
    total?: number;
    page?: number;
    perPage?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
    start?: number;
    next?: unknown;
  };
};
```

## Main Config Options

| Key | Purpose |
| --- | --- |
| `service.getAll` | Required data loader |
| `enableSorting` | Set `true` to enable header sort UI and pass `query.sorting` to `getAll` (default off) |
| `columns` | TanStack column definitions (`sortable` shorthand when sorting is enabled) |
| `searchFields` | Enables built-in search keys in `filters` |
| `actions` | Toolbar buttons |
| `rowActions` | Per-row action buttons (rendered with `Button`, `variant="ghost"` default; override with `buttonVariant`) |
| `autoRowActionsColumn` | Set `false` to suppress the auto-injected Actions column |
| `filtersUI` | Inline filter UI slot |
| `renderFilters` | Full override for the filters area |
| `views` | Enables `table`, `grid`, `list`, `map` modes |
| `pageHeader` | Title and subtitle above the table |
| `classNames` | Partial `DataTableClassNames` override |
| `labels` | Partial `DataTableLabels` override |
| `layoutComponents` | Replace header, toolbar, or shell wrappers |
| `chromeToolbar` | Dark chrome toolbar when `true` (default); `false` for legacy light toolbar |
| `onOpenModal` | Modal integration for actions (see [Modals](#modals-and-datatableactionscontext)) |
| `onRegisterModal` | Receives a map of all modal handlers keyed by action id |
| `onUrlAction` | Fires once on mount; use to sync URL params into table state |
| `onAfterMutationSuccess` | Runs after `context.refresh()` / toolbar refresh refetch (not after raw `refetch`) |

## Modals and `DataTableActionsContext`

The table **does not render dialogs**. It tells your app to open them by calling **`config.onOpenModal(type, props)`** whenever an action uses **`openModal`**.

### Flow

1. **Toolbar action** (`config.actions`): `openModal({ context })` may return `{ type, props }`.
2. **Row action** (`config.rowActions`): `openModal({ record, context })` may return `{ type, props }`.
3. The library merges **`props`** from that return value with the live table **`context`** (and **`record`** for row actions). Your modal component receives a single `props` object.

Merged props always include:

- **`context`** — full **`DataTableActionsContext`** (pagination, filters, **`refetch`**, **`refresh`**, `rows`, etc.).
- **`record`** — row data (row actions only).
- **`dataTableContext`** — same object as **`context`**; use if your app accidentally overwrites or strips **`context`** when forwarding to a store.

Any `context` / `record` keys inside the action’s returned `props` are **dropped** before merge so placeholders cannot replace the real table context.

### Your responsibilities

1. Implement **`onOpenModal`** — typically forward into your modal layer **without** rebuilding or serializing props:

   ```tsx
   onOpenModal: (type, props) => {
     useModalStore.getState().openModal(type, props);
   };
   ```

   Avoid `JSON.parse(JSON.stringify(props))`, whitelists that omit **`context`**, or patterns like `context: ref.current ?? {}` unless `ref` truly holds **`DataTableActionsContext`**.

2. Render the modal (e.g. a host that does `<Component {...modal.props} open={...} />`) so **`context`** / **`dataTableContext`** reach the component.

3. After a successful mutation, reload the table in a way that can run follow-up hooks:

   - **`await context.refresh()`** (or **`refreshAfterMutation()`**) — refetches this table’s query, then runs **`onAfterMutationSuccess`** if configured.
   - **`await context.refetch()`** — TanStack Query refetch **only**; does **not** run **`onAfterMutationSuccess`**.

### `DataTableActionsContext` (modal-relevant fields)

| Field | Role |
| --- | --- |
| `context.refresh()` | Refetch table + optional **`onAfterMutationSuccess`** |
| `context.refreshAfterMutation()` | Same pipeline as **`refresh()`** |
| `context.refetch()` | Raw query refetch; no **`onAfterMutationSuccess`** |
| `context.rows`, `filters`, `setPage`, … | Same object passed to filters and actions |

### Optional: `onRegisterModal`

The library can expose a registry of async handlers keyed by `"<tableId>:action:<id>"` and `"<tableId>:rowAction:<id>"` so other code (menus, shortcuts) can trigger the same `openModal` logic. You still need **`onOpenModal`** to actually show the UI.

### Types

- **`OpenModalCallback`** — `(type, props) => void` where `props` includes **`context`** (and **`record`** for row-driven modals).
- **`OnAfterMutationSuccessArgs`** — `{ queryClient, refetch }` passed to **`onAfterMutationSuccess`**.

More examples (filters, row actions, Zustand): see **§6 Refetching and mutation follow-up** in [USAGE.md](./USAGE.md).

## View Modes

Supported modes: `table`, `grid`, `list`, `map`.

- `grid` requires `views.renderGridItem`
- `list` requires `views.renderListItem`
- `map` requires `views.map.getCoordinates` and `views.map.renderCard`

The selected mode is persisted to `localStorage` by default. Disable with
`views.persistMode: false`. Grid and list items are keyed by `id`, `_id`,
`uuid`, or `key` on the record — falling back to array index only when none of
those fields exist.

## Styling And Layout

The package ships with default layout tokens and copy helpers:

```ts
import {
  DEFAULT_DATA_TABLE_CLASSNAMES,
  DEFAULT_DATA_TABLE_LABELS,
  mergeDataTableClassNames,
  mergeDataTableLabels,
} from "genesis-react-data-table";
```

Use:

- `classNames` to override CSS class tokens
- `labels` to replace built-in text
- `layoutComponents` to replace wrappers such as `PageHeader`, `Toolbar`, and `TableShell`

## Filters Host Registration

If your `filtersUI` uses `formConfig` plus `onApply`, register a host component once at app startup:

```tsx
import { setDefaultDataTableFiltersHost } from "genesis-react-data-table/setup";
import { MyFiltersHost } from "./MyFiltersHost";

setDefaultDataTableFiltersHost(MyFiltersHost);
```

This is useful when your application already has a dynamic form system and you want the table to render that form inside the toolbar.

## Public Exports

Main exports:

- `DataTable`
- `DataTablePageHeader`
- `DataTableToolbar`
- `ActionButtonsBar`
- `UserActionCell`
- `SearchInput`
- `InlineFiltersUI`
- `componentCell`
- `setDefaultDataTableFiltersHost` (also at `genesis-react-data-table/setup`)
- `isModalPayload`
- `OnAfterMutationSuccessArgs`
- `mergeDataTableClassNames`
- `mergeDataTableLabels`
- `DEFAULT_DATA_TABLE_CLASSNAMES`
- `DEFAULT_DATA_TABLE_LABELS`

Key types:

- `DataTableConfig`
- `DataTableProps`
- `DataTableViewsConfig`
- `DataTableActionsContext`
- `DataTableColumnDef`
- `DataTableViewMode`
- `DataTableMapViewConfig`
- `DataTableClassNames`
- `DataTableLabels`
- `DataTableLayoutComponents`
- `ServiceQuery`
- `ServiceResult`
- `TableAction`
- `RowAction`

## Usage Guide

For real examples covering typed filters, actions, row modals, view modes, and styling, see [USAGE.md](./USAGE.md).

## Development

```bash
npm install
npm run build
npm test
```

Build-related notes:

- `prepare` runs `npm run build`
- `prepublishOnly` runs `npm run build`
- the published package ships from `dist/`

## License

MIT. See `LICENSE`.
