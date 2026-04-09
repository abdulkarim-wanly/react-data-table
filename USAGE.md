# Usage Guide

This file shows the common ways to use `genesis-react-data-table` in an app.

## 1. Basic Table

```tsx
import { DataTable, type DataTableConfig } from "genesis-react-data-table";

type User = {
  id: string;
  name: string;
  email: string;
};

const config: DataTableConfig<User> = {
  service: {
    getAll: async (query) => {
      const response = await fetch("/api/users/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      return response.json();
    },
  },
  columns: [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name", sortable: true },
    { accessorKey: "email", header: "Email" },
  ],
  defaultPerPage: 10,
  pageHeader: {
    title: "Users",
    subtitle: "Manage user accounts",
  },
};

export function UsersPage() {
  return <DataTable config={config} />;
}
```

## 2. Typed Filters

Use the second generic to keep `query.filters` typed.

```tsx
import { DataTable, type DataTableConfig } from "genesis-react-data-table";

type User = {
  id: string;
  name: string;
  status: "active" | "archived";
};

type UserFilters = {
  status?: "active" | "archived";
  role?: string;
};

const config: DataTableConfig<User, UserFilters> = {
  service: {
    getAll: async (query) => {
      query.filters.status;
      query.filters.role;

      return {
        data: [],
        meta: {
          total: 0,
          page: query.page,
          perPage: query.perPage,
        },
      };
    },
  },
  columns: [{ accessorKey: "name", header: "Name" }],
};

export function UsersPage() {
  return <DataTable<User, UserFilters> config={config} />;
}
```

If `searchFields` is enabled, the table also adds:

```ts
{
  search?: string;
  searchFields?: string[];
}
```

to the filter object passed into `service.getAll`.

## 3. Search

Enable built-in search by adding `searchFields`.

```tsx
const config: DataTableConfig<User> = {
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
  searchFields: ["name", "email"],
};
```

The table will merge the current search term into `query.filters.search` and `query.filters.searchFields`.

## 4. Toolbar Actions

Use `actions` for global table-level buttons.

```tsx
import { Download, Plus } from "lucide-react";
import { type DataTableConfig } from "genesis-react-data-table";

const config: DataTableConfig<User> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [{ accessorKey: "name", header: "Name" }],
  actions: [
    {
      id: "create",
      label: "Create user",
      icon: Plus,
      openModal: async () => ({
        type: "create-user",
      }),
    },
    {
      id: "export",
      label: "Export current page",
      icon: Download,
      onClick: async ({ context }) => {
        console.log(context.rows);
      },
    },
  ],
  onOpenModal: (type, props) => {
    console.log(type, props);
  },
};
```

Each toolbar action receives the full `DataTableActionsContext`.

## 5. Row Actions

Use `rowActions` for per-record buttons.

```tsx
import { Eye, Pencil } from "lucide-react";
import { type DataTableConfig } from "genesis-react-data-table";

const config: DataTableConfig<User> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [{ accessorKey: "name", header: "Name" }],
  rowActions: [
    {
      id: "view",
      label: "View",
      icon: Eye,
      openModal: async ({ record }) => ({
        type: "view-user",
        props: { userId: record.id },
      }),
    },
    {
      id: "edit",
      label: "Edit",
      icon: Pencil,
      visibleWhen: (record) => record.status !== "archived",
      onClick: async ({ record }) => {
        console.log("Edit", record.id);
      },
    },
  ],
  onOpenModal: (type, props) => {
    console.log(type, props);
  },
};
```

By default the table appends an `Actions` column automatically when `rowActions` exists.

If you already render actions in your own column, disable that behavior:

```tsx
autoRowActionsColumn: false;
```

## 6. Custom Filters UI

Use `filtersUI` when you want inline custom filters.

### Function form

```tsx
filtersUI: (context) => (
  <button
    type="button"
    onClick={() => context.applyFilters({ status: "active" })}
  >
    Active only
  </button>
);
```

### Object form with `render`

```tsx
filtersUI: {
  render: ({ filters, applyFilters, resetFilters }) => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => applyFilters({ ...filters, status: "active" })}
      >
        Active
      </button>
      <button type="button" onClick={resetFilters}>
        Reset
      </button>
    </div>
  ),
};
```

### Dynamic form host

If your app already has a reusable filter form, register it once:

```tsx
import { setDefaultDataTableFiltersHost } from "genesis-react-data-table/setup";
import { AppFiltersHost } from "./AppFiltersHost";

setDefaultDataTableFiltersHost(AppFiltersHost);
```

Then configure tables with `formConfig` and `onApply`:

```tsx
filtersUI: {
  formConfig: () => ({
    id: "user-filters",
    fields: [
      { name: "status", type: "select" },
      { name: "role", type: "text" },
    ],
  }),
  onApply: ({ values, context }) => {
    context.applyFilters(values as { status?: string; role?: string });
  },
};
```

## 7. Full Filters Override

If you want complete control of the filters area, use `renderFilters`.

```tsx
renderFilters: (context) => (
  <div className="flex gap-2">
    <button type="button" onClick={() => context.applyFilters({ status: "active" })}>
      Active
    </button>
    <button type="button" onClick={context.resetFilters}>
      Reset
    </button>
  </div>
);
```

When `renderFilters` is set, the table ignores `filtersUI` for that slot.

## 8. Grid And List Views

Enable alternate renderers with `views`.

```tsx
const config: DataTableConfig<User> = {
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
    modes: ["table", "grid", "list"],
    defaultMode: "table",
    renderGridItem: ({ record }) => (
      <article className="rounded-xl border p-4">
        <h3>{record.name}</h3>
        <p>{record.email}</p>
      </article>
    ),
    renderListItem: ({ record }) => (
      <div className="rounded-lg border p-3">
        {record.name} - {record.email}
      </div>
    ),
  },
};
```

## 9. Map View

Map view requires Leaflet CSS and coordinate mapping.

```tsx
import "leaflet/dist/leaflet.css";

type Property = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
};

const config: DataTableConfig<Property> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [{ accessorKey: "name", header: "Name" }],
  views: {
    modes: ["table", "map"],
    map: {
      getCoordinates: (record) => ({ lat: record.lat, lng: record.lng }),
      renderCard: ({ record, isActive }) => (
        <article className={isActive ? "rounded-xl border border-blue-500 p-4" : "rounded-xl border p-4"}>
          <h3>{record.name}</h3>
          <p>{record.city}</p>
        </article>
      ),
      sidebarTitle: "Property locations",
      initialZoom: 10,
      showNavigation: true,
    },
  },
};
```

Map layout options:

- `layout: "full"` is the default
- `layout: "split"` shows a sidebar plus map

## 10. Styling

Override layout class names through `classNames`.

```tsx
import {
  DEFAULT_DATA_TABLE_CLASSNAMES,
  type DataTableConfig,
} from "genesis-react-data-table";

const config: DataTableConfig<User> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [{ accessorKey: "name", header: "Name" }],
  classNames: {
    ...DEFAULT_DATA_TABLE_CLASSNAMES,
    root: "flex flex-col gap-4",
    tableOuter: "rounded-2xl border overflow-hidden",
    tableScroll: "max-h-[520px] overflow-auto",
  },
};
```

Or merge a partial override:

```tsx
import { mergeDataTableClassNames } from "genesis-react-data-table";

const classNames = mergeDataTableClassNames({
  tableOuter: "rounded-2xl border overflow-hidden",
  tableScroll: "max-h-[520px] overflow-auto",
});
```

### Chrome toolbar buttons (`chromeToolbar`)

Style each control separately via `classNames`:

| Key | Element |
|-----|---------|
| `toolbarButtonViewMode` | View mode dropdown trigger (icon) |
| `toolbarRefreshButton` | Refresh (icon) |
| `toolbarButtonSearchOpen` | Collapsed search (opens field) |
| `toolbarButtonSearchClose` | Expanded search (closes field, joined to input) |
| `toolbarDropdownItemIconWrap` | Icon box in each view menu row |
| `toolbarDropdownItemIconWrapActive` | Added for the active view row’s icon box |

Set **`toolbarIconButton`** once in a partial merge to reuse the same base classes for view, search open/close, and refresh (see `mergeDataTableClassNames` — it copies into the keys above unless you override them individually).

## 11. Labels

Replace default English labels through `labels`.

```tsx
const config: DataTableConfig<User> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [{ accessorKey: "name", header: "Name" }],
  labels: {
    noResults: "No users found",
    errorLoading: "Could not load users",
    toolbarRefresh: "Reload",
    viewAsGrid: "Cards",
  },
};
```

## 12. Custom Layout Wrappers

Use `layoutComponents` to swap wrapper components while keeping the table logic.

```tsx
import type {
  DataTableConfig,
  DataTablePageHeaderSlotProps,
  DataTableToolbarSlotProps,
} from "genesis-react-data-table";

function PageHeader({
  title,
  subtitle,
  rightSlot,
  classNames,
}: DataTablePageHeaderSlotProps) {
  return (
    <div className={classNames.headerCard}>
      <div className={classNames.pageHeaderWrapper}>
        <h2 className={classNames.pageTitle}>{title}</h2>
        <p className={classNames.pageSubtitle}>{subtitle}</p>
      </div>
      <div className={classNames.actionsWrapper}>{rightSlot}</div>
    </div>
  );
}

function Toolbar({ children, classNames }: DataTableToolbarSlotProps) {
  return <div className={classNames.filtersAndSearchRow}>{children}</div>;
}

const config: DataTableConfig<User> = {
  service: {
    getAll: async (query) => ({
      data: [],
      meta: { total: 0, page: query.page, perPage: query.perPage },
    }),
  },
  columns: [{ accessorKey: "name", header: "Name" }],
  layoutComponents: {
    PageHeader,
    Toolbar,
  },
};
```

## 13. Useful Exports

You can also import:

- `ActionButtonsBar`
- `UserActionCell`
- `SearchInput`
- `InlineFiltersUI`
- `DataTablePageHeader`
- `DataTableToolbar`
- `componentCell`
- `mergeDataTableClassNames`
- `mergeDataTableLabels`

## 14. Common Notes

- `service.getAll` is the only required integration point.
- Pagination behaves best when you return `meta.total`.
- `hasNext` and `hasPrevious` are useful for cursor-style APIs.
- The selected view mode is persisted by default.
- `chromeToolbar` is enabled by default.
- `onOpenModal` is only needed if your actions use `openModal`.
