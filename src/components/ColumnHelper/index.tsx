import React from 'react';

/**
 * Helper to create a cell renderer that wraps a custom component. This mirrors
 * the pattern used in TanStack Table examples where a component is rendered
 * with the row’s record as a prop. Extra props can be supplied when the
 * component is created.
 */
export function componentCell<TRecord>(
  Component: React.ComponentType<{ record: TRecord } & Record<string, unknown>>,
  extraProps?: Record<string, unknown>
): (args: { row: { original: TRecord } }) => React.JSX.Element {
  return function CellRenderer({ row }) {
    const record = row.original;
    return <Component record={record} {...(extraProps || {})} />;
  };
}
