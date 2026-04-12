const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const {
  DEFAULT_DATA_TABLE_CLASSNAMES,
  DEFAULT_DATA_TABLE_LABELS,
  InlineFiltersUI,
  isModalPayload,
  mergeDataTableLabels,
  setDefaultDataTableFiltersHost,
} = require('../dist/index.cjs.js');

const context = {
  filters: {},
  applyFilters: () => {},
  resetFilters: () => {},
};

afterEach(() => {
  setDefaultDataTableFiltersHost(null);
});

describe('public helpers', () => {
  test('mergeDataTableLabels keeps the default actions column label and allows override', () => {
    expect(DEFAULT_DATA_TABLE_LABELS.actionsColumn).toBe('Actions');
    expect(DEFAULT_DATA_TABLE_LABELS.viewAsGrid).toBe('Grid');
    expect(DEFAULT_DATA_TABLE_LABELS.viewAsMap).toBe('Map');
    expect(mergeDataTableLabels({}).actionsColumn).toBe('Actions');
    expect(mergeDataTableLabels({ actionsColumn: 'Ops' }).actionsColumn).toBe('Ops');
    expect(mergeDataTableLabels({ viewAsList: 'Rows' }).viewAsList).toBe('Rows');
  });

  test('default table header cells are left-aligned', () => {
    expect(DEFAULT_DATA_TABLE_CLASSNAMES.tableHeadCell).toContain('text-left');
  });

  test('isModalPayload accepts only the expected modal payload shape', () => {
    expect(isModalPayload({ type: 'edit' })).toBe(true);
    expect(isModalPayload({ type: 'edit', props: { id: 1 } })).toBe(true);
    expect(isModalPayload({ props: { id: 1 } })).toBe(false);
    expect(isModalPayload({ type: 42 })).toBe(false);
    expect(isModalPayload(null)).toBe(false);
  });
});

describe('InlineFiltersUI', () => {
  test('renders the registered default host for formConfig + onApply bags', () => {
    function Host({ formConfig }) {
      return React.createElement('div', { 'data-host': 'default' }, formConfig.id);
    }

    setDefaultDataTableFiltersHost(Host);

    const html = renderToStaticMarkup(
      React.createElement(InlineFiltersUI, {
        context,
        filtersUI: {
          formConfig: () => ({ id: 'filters-form' }),
          onApply: () => {},
        },
      })
    );

    expect(html).toContain('data-host="default"');
    expect(html).toContain('filters-form');
  });

  test('renders the function form directly when filtersUI is a render function', () => {
    const html = renderToStaticMarkup(
      React.createElement(InlineFiltersUI, {
        context,
        filtersUI: (ctx) => React.createElement('span', null, `filters:${Object.keys(ctx.filters).length}`),
      })
    );

    expect(html).toContain('filters:0');
  });
});
