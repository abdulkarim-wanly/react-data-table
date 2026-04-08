const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const { DataTable } = require('../dist/index.cjs.js');

afterEach(() => {
  delete global.localStorage;
});

function getDefaultQueryKey(config) {
  const tableId = config.id || 'table';
  const base = config.queryKey || [tableId];
  return [
    ...base,
    {
      page: 1,
      perPage: config.defaultPerPage || 10,
      sorting: [],
      filters: {},
    },
  ];
}

function renderTable(config, options = {}) {
  const client = new QueryClient();
  if (options.prefetchedData) {
    client.setQueryData(getDefaultQueryKey(config), options.prefetchedData);
  }
  const html = renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(DataTable, {
        config: {
          staleTime: Number.POSITIVE_INFINITY,
          gcTime: Number.POSITIVE_INFINITY,
          refetchOnWindowFocus: false,
          ...config,
        },
      })
    )
  );
  client.clear();
  return html;
}

function countOccurrences(text, token) {
  return text.split(token).length - 1;
}

describe('DataTable rowActions', () => {
  const baseConfig = {
    service: {
      getAll: async () => ({
        data: [{ id: '1', name: 'Alice' }],
        meta: { total: 1, page: 1, perPage: 10 },
      }),
    },
    columns: [{ accessorKey: 'name', header: 'Name' }],
  };

  test('adds the default Actions header when rowActions are provided', () => {
    const html = renderTable({
      ...baseConfig,
      rowActions: [{ id: 'view', label: 'View', onClick: async () => {} }],
    });

    expect(html).toContain('Name');
    expect(html).toContain('Actions');
  });

  test('uses labels.actionsColumn for the built-in row actions header', () => {
    const html = renderTable({
      ...baseConfig,
      labels: { actionsColumn: 'Operations' },
      rowActions: [{ id: 'archive', label: 'Archive', onClick: async () => {} }],
    });

    expect(html).toContain('Operations');
    expect(html).not.toContain('>Actions<');
  });

  test('does not append the row actions header when rowActions are omitted', () => {
    const html = renderTable(baseConfig);

    expect(html).toContain('Name');
    expect(html).not.toContain('Actions');
  });

  test('does not append the built-in actions column when autoRowActionsColumn is false', () => {
    const html = renderTable({
      ...baseConfig,
      autoRowActionsColumn: false,
      rowActions: [{ id: 'view', label: 'View', onClick: async () => {} }],
    });

    expect(html).toContain('Name');
    expect(html).not.toContain('Actions');
  });

  test('does not append a second actions column when one already exists in config.columns', () => {
    const html = renderTable(
      {
        ...baseConfig,
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { id: 'actions', header: 'Actions', cell: () => React.createElement('span', null, 'Manual actions') },
        ],
        rowActions: [{ id: 'view', label: 'View', onClick: async () => {} }],
      },
      {
        prefetchedData: {
          data: [{ id: '1', name: 'Alice' }],
          meta: { total: 1, page: 1, perPage: 10 },
        },
      }
    );

    expect(countOccurrences(html, '>Actions<')).toBe(1);
    expect(html).toContain('Manual actions');
  });
});

describe('DataTable view modes', () => {
  const baseConfig = {
    service: {
      getAll: async () => ({
        data: [{ id: '1', name: 'Alice' }],
        meta: { total: 1, page: 1, perPage: 10 },
      }),
    },
    columns: [{ accessorKey: 'name', header: 'Name' }],
  };

  const prefetchedData = {
    data: [{ id: '1', name: 'Alice' }],
    meta: { total: 1, page: 1, perPage: 10 },
  };

  test('renders view mode toggle buttons when multiple modes are enabled (legacy toolbar)', () => {
    const html = renderTable({
      ...baseConfig,
      chromeToolbar: false,
      views: {
        modes: ['table', 'grid', 'list', 'map'],
        renderGridItem: ({ record }) => React.createElement('div', null, record.name),
        renderListItem: ({ record }) => React.createElement('div', null, record.name),
        map: {
          getCoordinates: () => ({ lat: 33.3152, lng: 44.3661 }),
          renderCard: ({ record }) => React.createElement('div', null, record.name),
        },
      },
    });

    expect(html).toContain('Table');
    expect(html).toContain('Grid');
    expect(html).toContain('List');
    expect(html).toContain('Map');
  });

  test('renders chrome toolbar with shadcn-style view menu when multiple modes are enabled', () => {
    const html = renderTable(
      {
        ...baseConfig,
        views: {
          modes: ['table', 'grid', 'list', 'map'],
          renderGridItem: ({ record }) => React.createElement('div', null, record.name),
          renderListItem: ({ record }) => React.createElement('div', null, record.name),
          map: {
            getCoordinates: () => ({ lat: 33.3152, lng: 44.3661 }),
            renderCard: ({ record }) => React.createElement('div', null, record.name),
          },
        },
      },
      { prefetchedData }
    );

    expect(html).toContain('View');
    expect(html).not.toContain('Sort');
    expect(html).toContain('Refresh');
    expect(html).toContain('rounded-xl border border-zinc-200/90');
  });

  test('renders the grid renderer when grid is the default mode', () => {
    const html = renderTable(
      {
        ...baseConfig,
        views: {
          modes: ['table', 'grid'],
          defaultMode: 'grid',
          renderGridItem: ({ record }) =>
            React.createElement('article', { 'data-grid-item': record.id }, record.name),
        },
      },
      { prefetchedData }
    );

    expect(html).toContain('data-grid-item="1"');
    expect(html).not.toContain('<table');
  });

  test('renders the list renderer when list is the default mode', () => {
    const html = renderTable(
      {
        ...baseConfig,
        views: {
          modes: ['table', 'list'],
          defaultMode: 'list',
          renderListItem: ({ record }) =>
            React.createElement('section', { 'data-list-item': record.id }, record.name),
        },
      },
      { prefetchedData }
    );

    expect(html).toContain('data-list-item="1"');
    expect(html).not.toContain('<table');
  });

  test('ignores non-table modes that do not provide a renderer', () => {
    const html = renderTable({
      ...baseConfig,
      views: {
        modes: ['table', 'grid'],
      },
    });

    expect(html).toContain('<table');
    expect(html).not.toContain('Grid');
  });

  test('renders the map view layout when map is the default mode (split sidebar)', () => {
    const html = renderTable(
      {
        ...baseConfig,
        views: {
          modes: ['table', 'map'],
          defaultMode: 'map',
          map: {
            layout: 'split',
            sidebarTitle: 'Property locations',
            getCoordinates: () => ({ lat: 33.3152, lng: 44.3661 }),
            renderCard: ({ record }) =>
              React.createElement('article', { 'data-map-card': record.id }, record.name),
          },
        },
      },
      { prefetchedData }
    );

    expect(html).toContain('Property locations');
    expect(html).toContain('data-map-card="1"');
    expect(html).not.toContain('<table');
  });

  test('renders full map layout without sidebar list until a marker is selected', () => {
    const html = renderTable(
      {
        ...baseConfig,
        views: {
          modes: ['table', 'map'],
          defaultMode: 'map',
          map: {
            getCoordinates: () => ({ lat: 33.3152, lng: 44.3661 }),
            renderCard: ({ record }) =>
              React.createElement('article', { 'data-map-card': record.id }, record.name),
          },
        },
      },
      { prefetchedData }
    );

    expect(html).toContain('data-genesis-map-layout="full"');
    expect(html).not.toContain('data-map-card=');
    expect(html).not.toContain('<table');
  });

  test('restores the persisted view mode from localStorage', () => {
    global.localStorage = {
      getItem: jest.fn(() => 'grid'),
      setItem: jest.fn(),
    };

    const html = renderTable(
      {
        ...baseConfig,
        id: 'users',
        views: {
          modes: ['table', 'grid'],
          defaultMode: 'table',
          renderGridItem: ({ record }) =>
            React.createElement('article', { 'data-grid-item': record.id }, record.name),
        },
      },
      { prefetchedData }
    );

    expect(global.localStorage.getItem).toHaveBeenCalledWith('genesis-react-data-table:users:view-mode');
    expect(html).toContain('data-grid-item="1"');
    expect(html).not.toContain('<table');
  });

  test('ignores persisted storage when views.persistMode is false', () => {
    global.localStorage = {
      getItem: jest.fn(() => 'grid'),
      setItem: jest.fn(),
    };

    const html = renderTable(
      {
        ...baseConfig,
        id: 'users',
        views: {
          modes: ['table', 'grid'],
          defaultMode: 'table',
          persistMode: false,
          renderGridItem: ({ record }) =>
            React.createElement('article', { 'data-grid-item': record.id }, record.name),
        },
      },
      { prefetchedData }
    );

    expect(global.localStorage.getItem).not.toHaveBeenCalled();
    expect(html).toContain('<table');
  });
});
