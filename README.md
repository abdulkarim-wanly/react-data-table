# genesis-react-data-table

Configurable **React** data table built on [**TanStack Table**](https://tanstack.com/table) v8 and [**TanStack Query**](https://tanstack.com/query) v5. Includes search, pagination, sorting, toolbar actions, row actions, optional custom filter UI, and **full TypeScript** generics for row and filter types.

## Requirements

- **React** ≥ 18  
- **Peer dependencies** (install explicitly in your app):

| Package | Notes |
|--------|--------|
| `react` / `react-dom` | ≥ 18 |
| `@tanstack/react-query` | v5 — wrap your app in `QueryClientProvider` |
| `@tanstack/react-table` | v8 |
| `react-i18next` | ≥ 11 (e.g. 15.x is supported) + `i18next` |
| `lucide-react` | ≥ 0.400 — icons used by the built-in search UI |

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
npm install @tanstack/react-query @tanstack/react-table react-i18next i18next lucide-react
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
npm install genesis-react-data-table @tanstack/react-query @tanstack/react-table react-i18next i18next lucide-react
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

### 3. Styling

Components use **utility class names** (Tailwind-style: `flex`, `gap-4`, `min-w-full`, etc.). Your app should include **Tailwind** (or equivalent CSS) so layout and spacing match your design system.

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

---

## `DataTable` config reference

| Property | Description |
|----------|-------------|
| `service.getAll` | **Required.** `(query: ServiceQuery<TFilters>) => Promise<ServiceResult<TRecord>>` |
| `columns` | TanStack **`ColumnDef<TRecord>[]`**; you may use **`sortable?: boolean`** (alias for `enableSorting`) |
| `rowActions` | **`RowAction<TRecord, TFilters>[]`** for per-row menus/buttons |
| `actions` | **`TableAction<TRecord, TFilters>[]`** for toolbar buttons |
| `id` | Stable table id (default `"table"`); used in modal registry keys |
| `queryKey` | Extra React Query key prefix; defaults to `[id]` |
| `defaultPerPage` | Page size (default `10`) |
| `searchFields` | Field names merged into `filters` for server search |
| `pageHeader` | `{ title?, subtitle? }` |
| `renderFilters` | `(context) => ReactNode` — custom filter UI; use **`context.applyFilters`**, **`context.resetFilters`**, etc. |
| `filtersUI` | Deprecated; not rendered — use **`renderFilters`** |
| `onOpenModal` | `(type, props) => void` when actions use **`openModal`** |
| `onRegisterModal` | Receives a map of modal handler ids |
| `onUrlAction` | Runs **once** on mount with **`config`** and **`context`** |
| `staleTime` / `gcTime` / `refetchOnWindowFocus` | Passed to **`useQuery`** |
| `skeletonRows` | Loading placeholder row count |

---

## `DataTableActionsContext` (for actions & `renderFilters`)

Exposed on toolbar actions, row actions, and **`renderFilters`**:

- **`refetch`**, **`refresh`**, **`isFetching`**
- **`page`**, **`perPage`**, **`setPage`**, **`setPerPage`**
- **`sorting`**, **`setSorting`**
- **`filters`**, **`setFilters`**, **`applyFilters`**, **`resetFilters`**
- **`setSearchValue`** (wired to internal search state)
- **`rows`** — current page data: **`TRecord[]`**
- **`meta`** — last **`ServiceResult`** meta or **`undefined`**

---

## Row actions and `UserActionCell`

Use **`UserActionCell`** inside a column cell when you need the same row actions as **`config.rowActions`**:

```tsx
import { UserActionCell, type RowAction } from "genesis-react-data-table";

// Pass the same TRecord / TFilters as DataTable.
// You need table `context` from your page (e.g. lifted state, or render prop pattern).
```

Wire **`onOpenModal`** on **`DataTable`** if actions return **`openModal`** payloads.

---

## Exports

**Components:** `DataTable`, `ActionButtonsBar`, `UserActionCell`, `SearchInput`, `InlineFiltersUI` (stub), `componentCell` (column helper).

**Types:** `DataTableConfig`, `DataTableProps`, `DataTableActionsContext`, `DataTableColumnDef`, `ServiceQuery`, `ServiceResult`, `DataTableQueryMeta`, `FilterValues`, `MergedTableFilters`, `TableAction`, `RowAction`, `ModalPayload`, `ModalRegistryHandler`, `OpenModalCallback`, …

**Util:** `isModalPayload` (for custom modal flows).

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
