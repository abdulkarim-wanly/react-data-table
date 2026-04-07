const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const { DataTable } = require('../dist/index.cjs.js');

function renderTable(config) {
  const client = new QueryClient();
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
});
