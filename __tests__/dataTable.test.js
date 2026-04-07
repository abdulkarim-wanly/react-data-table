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

  test('renders view mode toggle buttons when multiple modes are enabled', () => {
    const html = renderTable({
      ...baseConfig,
      views: {
        modes: ['table', 'grid', 'list'],
        renderGridItem: ({ record }) => React.createElement('div', null, record.name),
        renderListItem: ({ record }) => React.createElement('div', null, record.name),
      },
    });

    expect(html).toContain('Table');
    expect(html).toContain('Grid');
    expect(html).toContain('List');
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
