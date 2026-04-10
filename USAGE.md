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
type UserFilters = {
  status?: "active" | "archived";
  role?: string;
};

const config: DataTableConfig<User, UserFilters> = {
  service: {
    getAll: async (query) => {
      // query.filters.status and query.filters.role are fully typed
      return fetch("/api/users", { ... }).then(r => r.json());
    },
  },
  columns: [{ accessorKey: "name", header: "Name" }],
};

export function UsersPage() {
  return <DataTable<User, UserFilters> config={config} />;
}
```

If `searchFields` is enabled, the table also merges:

```ts
{
  search?: string;
  searchFields?: string[];
}
```

into the filter object passed to `service.getAll`.

## 3. Search

Enable the built-in search input by adding `searchFields`.

```tsx
const config: DataTableConfig<User> = {
  service: { getAll: fetchUsers },
  columns: [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
  ],
  searchFields: ["name", "email"],
};
```

## 4. Toolbar Actions

Use `actions` for global table-level buttons.

```tsx
import { Download, Plus } from "lucide-react";

const config: DataTableConfig<User> = {
  service: { getAll: fetchUsers },
  columns: [...],
  actions: [
    {
      id: "create",
      label: "Create user",
      icon: Plus,
      openModal: async () => ({ type: "create-user" }),
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
    openMyModalSystem(type, props);
  },
};
```

## 5. Row Actions

Use `rowActions` for per-record buttons. They render using the shared `Button`
component (`size="sm"`, `variant="ghost"` by default) for visual consistency
with toolbar actions. Override the variant per action with `buttonVariant`.

```tsx
import { Eye, Pencil, Trash2 } from "lucide-react";

const config: DataTableConfig<User> = {
  service: { getAll: fetchUsers },
  columns: [...],
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
      onClick: async ({ record }) => console.log("Edit", record.id),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      buttonVariant: "destructive", // override the default ghost variant
      onClick: async ({ record }) => console.log("Delete", record.id),
    },
  ],
  onOpenModal: (type, props) => openMyModalSystem(type, props),
};
```

By default the table appends an `Actions` column automatically when `rowActions`
exists. Disable it if you already have an actions column:

```tsx
autoRowActionsColumn: false;
```

## 6. Sorting

Column sorting is server-side. Mark columns sortable with the `sortable`
shorthand (or TanStack's `enableSorting`). The current sort state is passed to
`service.getAll` via `query.sorting`. Sortable headers render an inline SVG
indicator — no emoji, no extra dependencies.

```tsx
columns: [
  { accessorKey: "name",      header: "Name",    sortable: true },
  { accessorKey: "email",     header: "Email",   sortable: true },
  { accessorKey: "createdAt", header: "Created", sortable: true },
  { accessorKey: "role",      header: "Role",    sortable: false },
],
```

## 7. Custom Filters UI

### Function form

```tsx
filtersUI: (context) => (
  <button type="button" onClick={() => context.applyFilters({ status: "active" })}>
    Active only
  </button>
);
```

### Object form with `render`

```tsx
filtersUI: {
  render: ({ filters, applyFilters, resetFilters }) => (
    <div className="flex gap-2">
      <button type="button" onClick={() => applyFilters({ ...filters, status: "active" })}>
        Active
      </button>
      <button type="button" onClick={resetFilters}>Reset</button>
    </div>
  ),
};
```

### Dynamic form host

Register your app's form system once at startup:

```tsx
import { setDefaultDataTableFiltersHost } from "genesis-react-data-table/setup";
import { AppFiltersHost } from "./AppFiltersHost";

setDefaultDataTableFiltersHost(AppFiltersHost);
```

Then configure each table with `formConfig` and `onApply`:

```tsx
filtersUI: {
  formConfig: () => ({
    id: "user-filters",
    fields: [
      { name: "status", type: "select" },
      { name: "role",   type: "text" },
    ],
  }),
  onApply: ({ values, context }) => {
    context.applyFilters(values as UserFilters);
  },
};
```

## 8. Full Filters Override

For complete control of the filters area, use `renderFilters`. When set, the
table ignores `filtersUI` for that slot.

```tsx
renderFilters: (context) => (
  <div className="flex gap-2">
    <button type="button" onClick={() => context.applyFilters({ status: "active" })}>
      Active
    </button>
    <button type="button" onClick={context.resetFilters}>Reset</button>
  </div>
);
```

## 9. Grid and List Views

Enable alternate renderers with `views`. The user's chosen mode is persisted in
`localStorage` by default. Grid/list items are keyed by `id`, `_id`, `uuid`, or
`key` on the record — falling back to array index only when none of those exist,
so React reconciliation stays correct when rows are filtered or reordered.

```tsx
const config: DataTableConfig<User> = {
  service: { getAll: fetchUsers },
  columns: [...],
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
        {record.name} — {record.email}
      </div>
    ),
  },
};
```

Disable localStorage persistence:

```tsx
views: {
  modes: ["table", "grid"],
  persistMode: false,
  renderGridItem: ({ record }) => <div>{record.name}</div>,
},
```

## 10. Map View

Map view requires Leaflet CSS and coordinate mapping.

```tsx
import "leaflet/dist/leaflet.css";

type Property = { id: string; name: string; city: string; lat: number; lng: number };

const config: DataTableConfig<Property> = {
  service: { getAll: fetchProperties },
  columns: [{ accessorKey: "name", header: "Name" }],
  views: {
    modes: ["table", "map"],
    map: {
      getCoordinates: (record) => ({ lat: record.lat, lng: record.lng }),
      renderCard: ({ record, isActive }) => (
        <article className={isActive ? "border-blue-500 border rounded-xl p-4" : "border rounded-xl p-4"}>
          <h3>{record.name}</h3>
          <p>{record.city}</p>
        </article>
      ),
      sidebarTitle: "Property locations",
      layout: "split", // or "full" (default)
      initialZoom: 10,
      showNavigation: true,
    },
  },
};
```

Layout options:

- `layout: "full"` (default) — map fills the container; tap a marker to open a React popup
- `layout: "split"` — sidebar list on the left, interactive map on the right

## 11. Styling

Override layout class names through `classNames`.

```tsx
import { mergeDataTableClassNames } from "genesis-react-data-table";

const config: DataTableConfig<User> = {
  service: { getAll: fetchUsers },
  columns: [...],
  classNames: mergeDataTableClassNames({
    tableOuter: "rounded-2xl border overflow-hidden",
    tableScroll: "max-h-[520px] overflow-auto",
  }),
};
```

### Chrome toolbar controls

| `classNames` key | Element |
|---|---|
| `toolbarButtonViewMode` | View mode dropdown trigger |
| `toolbarRefreshButton` | Refresh button |
| `toolbarButtonSearchOpen` | Collapsed search — opens the field |
| `toolbarButtonSearchClose` | Expanded search — closes the field |
| `toolbarDropdownItemIconWrap` | Icon box in each view menu row |
| `toolbarDropdownItemIconWrapActive` | Added for the active view row |

Set **`toolbarIconButton`** once to apply a shared base class to all icon
controls above (see `mergeDataTableClassNames`).

## 12. Labels

Replace default English labels through `labels`.

```tsx
const config: DataTableConfig<User> = {
  service: { getAll: fetchUsers },
  columns: [...],
  labels: {
    noResults:     "No users found",
    errorLoading:  "Could not load users",
    toolbarRefresh: "Reload",
    viewAsGrid:    "Cards",
    actionsColumn: "Operations", // renames the auto-injected row actions column
  },
};
```

## 13. Custom Layout Wrappers

Use `layoutComponents` to replace the header, toolbar, or table shell while
keeping all table logic.

```tsx
import type {
  DataTablePageHeaderSlotProps,
  DataTableToolbarSlotProps,
} from "genesis-react-data-table";

function PageHeader({ title, subtitle, rightSlot, classNames }: DataTablePageHeaderSlotProps) {
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
  service: { getAll: fetchUsers },
  columns: [...],
  layoutComponents: { PageHeader, Toolbar },
};
```

## 14. Modal Registry

`onRegisterModal` gives you a map of all action handlers keyed by
`"<tableId>:action:<id>"` or `"<tableId>:rowAction:<id>"`. Use it to
pre-register handlers at the app level.

```tsx
const config: DataTableConfig<User> = {
  id: "users",
  service: { getAll: fetchUsers },
  columns: [...],
  rowActions: [
    {
      id: "edit",
      label: "Edit",
      openModal: async ({ record }) => ({
        type: "edit-user",
        props: { userId: record.id },
      }),
    },
  ],
  onRegisterModal: (registry) => {
    // registry["users:rowAction:edit"] — callable externally
    console.log(Object.keys(registry));
  },
  onOpenModal: (type, props) => openMyModalSystem(type, props),
};
```

## 15. URL Actions

Use `onUrlAction` to sync URL query parameters on mount. The callback fires
**once** when the table mounts — it does not re-run if the callback reference
changes. Capture any values you need inside the callback itself.

```tsx
const config: DataTableConfig<User, UserFilters> = {
  service: { getAll: fetchUsers },
  columns: [...],
  onUrlAction: ({ context }) => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") as UserFilters["status"];
    if (status) context.applyFilters({ status });
  },
};
```

## 16. Useful Exports

Stand-alone components you can import independently:

- `ActionButtonsBar` — toolbar action buttons
- `UserActionCell` — row action buttons
- `SearchInput` — the built-in search input
- `InlineFiltersUI` — the inline filters slot
- `DataTablePageHeader` — the default page header
- `DataTableToolbar` — the chrome toolbar
- `componentCell` — column helper for rendering a component inside a cell

Helpers:

- `mergeDataTableClassNames`
- `mergeDataTableLabels`
- `setDefaultDataTableFiltersHost` (from `genesis-react-data-table/setup`)
- `isModalPayload`

## 17. Common Notes

- `service.getAll` is the only required integration point.
- Pagination behaves best when you return `meta.total`.
- `hasNext` / `hasPrevious` are useful for cursor-style APIs.
- The selected view mode is persisted to `localStorage` by default; disable with `views.persistMode: false`.
- `chromeToolbar` is enabled by default; set `chromeToolbar: false` to use the legacy light toolbar.
- `onOpenModal` is only needed if your actions use `openModal`.
- Row action buttons default to `variant="ghost"`; override per-action with `buttonVariant`.
- Grid/list items are keyed by `id`, `_id`, `uuid`, or `key` — falling back to index only when none exist.
- The package has `sideEffects: false`, enabling full tree-shaking for consumers using Webpack or Rollup.
