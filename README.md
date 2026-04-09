# genesis-react-data-table

A configurable React data table built on TanStack Table and TanStack Query.

It is designed for server-side data fetching with a typed `service.getAll` API, built-in search, pagination, sorting, toolbar actions, row actions, and optional `table`, `grid`, `list`, and `map` view modes.

## What It Includes

- Typed `DataTable<TRecord, TFilters>` API
- Server-side pagination, sorting, and filter flow
- Built-in search input
- Toolbar actions and row actions
- Optional grid, list, and map views
- Layout and class-name overrides
- React Query integration
- TypeScript exports for app-level composition

## Documentation

- Discovery and setup: `README.md`
- Practical examples: [USAGE.md](/c:/Users/Administrator/Downloads/my-react-data-table-lib/USAGE.md)

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

| Package | Version |
| --- | --- |
| `react` / `react-dom` | `>= 18` |
| `@tanstack/react-query` | `^5` |
| `@tanstack/react-table` | `^8` |
| `react-i18next` | `>= 11` |
| `i18next` | app dependency when using `react-i18next` |
| `lucide-react` | `>= 0.400.0` |
| `leaflet` | `^1.9` for map view |

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
| `columns` | TanStack column definitions |
| `searchFields` | Enables built-in search keys in `filters` |
| `actions` | Toolbar buttons |
| `rowActions` | Per-row action buttons |
| `filtersUI` | Inline filter UI slot |
| `renderFilters` | Full override for the filters area |
| `views` | Enables `table`, `grid`, `list`, `map` modes |
| `pageHeader` | Title and subtitle above the table |
| `classNames` | Partial `DataTableClassNames` override |
| `labels` | Partial `DataTableLabels` override |
| `layoutComponents` | Replace header, toolbar, or shell wrappers |
| `chromeToolbar` | Uses the built-in toolbar layout when `true` |
| `onOpenModal` | Modal integration for actions |
| `onRegisterModal` | Registers modal handlers by action id |

## View Modes

Supported modes:

- `table`
- `grid`
- `list`
- `map`

`grid` requires `views.renderGridItem`.

`list` requires `views.renderListItem`.

`map` requires `views.map.getCoordinates` and `views.map.renderCard`.

The table can persist the selected view mode in `localStorage`. This is enabled by default.

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
- `setDefaultDataTableFiltersHost`

Key types:

- `DataTableConfig`
- `DataTableProps`
- `DataTableViewsConfig`
- `DataTableActionsContext`
- `DataTableColumnDef`
- `DataTableViewMode`
- `DataTableMapViewConfig`
- `ServiceQuery`
- `ServiceResult`

## Usage Guide

For real examples covering typed filters, actions, row modals, view modes, and styling, see [USAGE.md](/c:/Users/Administrator/Downloads/my-react-data-table-lib/USAGE.md).

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
