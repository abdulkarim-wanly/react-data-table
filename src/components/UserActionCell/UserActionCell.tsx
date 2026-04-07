import React from 'react';
import type {
  DataTableActionsContext,
  FilterValues,
  ModalOpenAsyncResult,
  OpenModalCallback,
  TableIconComponent,
} from '../../tableTypes';
import { isModalPayload } from '../../tableTypes';

export interface RowAction<TRecord, TFilters extends FilterValues = FilterValues> {
  id: string;
  /**
   * Label can be a string or a function that receives the action context and
   * returns a string. The context is the same object passed to the table
   * actions and includes pagination, sorting and filter state.
   */
  label: string | ((context: DataTableActionsContext<TRecord, TFilters>) => string);
  /**
   * Optional React component to render an icon. Icons are not bundled with
   * this library; consumers can pass any component (e.g. from lucide-react).
   */
  icon?: TableIconComponent;
  /**
   * Return a payload for opening a modal. The library will call
   * `onOpenModal(payload.type, {...payload.props, context, record})`.
   */
  openModal?: (args: {
    record: TRecord;
    context: DataTableActionsContext<TRecord, TFilters>;
  }) => ModalOpenAsyncResult;
  /**
   * Called when the action is executed and no `openModal` is provided.
   */
  onClick?: (args: {
    record: TRecord;
    context: DataTableActionsContext<TRecord, TFilters>;
  }) => void | Promise<void>;
  /**
   * Optional condition to hide the action for a given record.
   */
  visibleWhen?: (record: TRecord) => boolean;
  /**
   * Optional disabled state based on context and record.
   */
  disabled?: (args: {
    record: TRecord;
    context: DataTableActionsContext<TRecord, TFilters>;
  }) => boolean;
}

export interface UserActionCellProps<TRecord, TFilters extends FilterValues = FilterValues> {
  record: TRecord;
  rowActions: RowAction<TRecord, TFilters>[];
  context: DataTableActionsContext<TRecord, TFilters>;
  onOpenModal?: OpenModalCallback;
}

/**
 * Simplified row actions cell. It renders a list of buttons for each action.
 * When an action defines `openModal`, the library calls the provided
 * `onOpenModal` callback with the returned modal type and props. Otherwise
 * it calls the action's `onClick` handler. This component does not depend
 * on external state or routing and can be easily styled by consumers.
 *
 * Pass the same `TRecord` and `TFilters` you use on `DataTable` so callbacks
 * stay fully typed.
 */
export function UserActionCell<TRecord, TFilters extends FilterValues = FilterValues>({
  record,
  rowActions = [],
  context,
  onOpenModal,
}: UserActionCellProps<TRecord, TFilters>) {
  const visibleActions = React.useMemo(() => {
    return rowActions.filter((action) => {
      if (typeof action.visibleWhen === 'function') {
        return action.visibleWhen(record);
      }
      return true;
    });
  }, [rowActions, record]);

  const handleAction = async (action: RowAction<TRecord, TFilters>) => {
    if (action.disabled && action.disabled({ record, context })) {
      return;
    }
    if (action.openModal) {
      const payload = await action.openModal({ record, context });
      if (isModalPayload(payload) && onOpenModal) {
        onOpenModal(payload.type, { ...(payload.props ?? {}), context, record });
      }
    } else if (action.onClick) {
      await action.onClick({ record, context });
    }
  };

  const renderLabel = (action: RowAction<TRecord, TFilters>) => {
    const Icon = action.icon;
    const label = typeof action.label === 'function' ? action.label(context) : action.label;
    return (
      <>
        {Icon ? <Icon className="inline-block mr-1 h-4 w-4" /> : null}
        {label}
      </>
    );
  };

  if (visibleActions.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="flex gap-2">
      {visibleActions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => handleAction(action)}
          disabled={action.disabled?.({ record, context }) || false}
        >
          {renderLabel(action)}
        </button>
      ))}
    </div>
  );
}
