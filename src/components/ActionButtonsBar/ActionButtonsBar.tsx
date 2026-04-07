import React from 'react';
import { Button } from '../ui/button';
import type {
  DataTableActionsContext,
  FilterValues,
  ModalOpenAsyncResult,
  OpenModalCallback,
  TableIconComponent,
} from '../../tableTypes';
import { isModalPayload } from '../../tableTypes';

export interface TableAction<TRecord = unknown, TFilters extends FilterValues = FilterValues> {
  id: string;
  label: string | ((context: DataTableActionsContext<TRecord, TFilters>) => string);
  icon?: TableIconComponent;
  buttonVariant?: string;
  disabled?: (context: DataTableActionsContext<TRecord, TFilters>) => boolean;
  /**
   * Handler called when the action is triggered. Only one of `onClick` or
   * `openModal` should be provided.
   */
  onClick?: (args: { context: DataTableActionsContext<TRecord, TFilters> }) => void | Promise<void>;
  /**
   * Handler returning a payload describing the modal to open. The library
   * invokes the provided `onOpenModal` callback with this payload.
   */
  openModal?: (args: { context: DataTableActionsContext<TRecord, TFilters> }) => ModalOpenAsyncResult;
}

export interface ActionButtonsBarProps<TRecord = unknown, TFilters extends FilterValues = FilterValues> {
  actions: TableAction<TRecord, TFilters>[];
  context: DataTableActionsContext<TRecord, TFilters>;
  onOpenModal?: OpenModalCallback;
}

/**
 * Renders a horizontal bar of action buttons above the table. Each action can
 * either perform side effects via `onClick` or open a modal via `openModal`.
 */
export function ActionButtonsBar<TRecord = unknown, TFilters extends FilterValues = FilterValues>({
  actions = [],
  context,
  onOpenModal,
}: ActionButtonsBarProps<TRecord, TFilters>) {
  const handleAction = async (action: TableAction<TRecord, TFilters>) => {
    if (action.disabled && action.disabled(context)) {
      return;
    }
    if (action.openModal) {
      const payload = await action.openModal({ context });
      if (isModalPayload(payload) && onOpenModal) {
        onOpenModal(payload.type, { ...(payload.props ?? {}), context });
      }
    } else if (action.onClick) {
      await action.onClick({ context });
    }
  };

  const renderLabel = (action: TableAction<TRecord, TFilters>) => {
    const Icon = action.icon;
    const label = typeof action.label === 'function' ? action.label(context) : action.label;
    return (
      <>
        {Icon ? <Icon className="inline-block mr-1 h-4 w-4" /> : null}
        {label}
      </>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          onClick={() => handleAction(action)}
          disabled={action.disabled?.(context) || false}
          variant={action.buttonVariant || 'outline'}
        >
          {renderLabel(action)}
        </Button>
      ))}
    </div>
  );
}
