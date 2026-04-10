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

export interface RowAction<TRecord, TFilters extends FilterValues = FilterValues> {
  id: string;
  label: string | ((context: DataTableActionsContext<TRecord, TFilters>) => string);
  icon?: TableIconComponent;
  /**
   * shadcn/ui Button variant (e.g. `'ghost'`, `'outline'`, `'destructive'`).
   * Defaults to `'ghost'` for compact row-level actions.
   */
  buttonVariant?: string;
  openModal?: (args: {
    record: TRecord;
    context: DataTableActionsContext<TRecord, TFilters>;
  }) => ModalOpenAsyncResult;
  onClick?: (args: {
    record: TRecord;
    context: DataTableActionsContext<TRecord, TFilters>;
  }) => void | Promise<void>;
  visibleWhen?: (record: TRecord) => boolean;
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
 * Row actions cell. Renders a `<Button>` (shadcn-style) for each visible action.
 * Defaults to `variant="ghost"` so actions stay compact inside table cells.
 * Override per-action with the `buttonVariant` field on {@link RowAction}.
 */
export function UserActionCell<TRecord, TFilters extends FilterValues = FilterValues>({
  record,
  rowActions = [],
  context,
  onOpenModal,
}: UserActionCellProps<TRecord, TFilters>) {
  const visibleActions = React.useMemo(() => {
    return rowActions.filter((action) =>
      typeof action.visibleWhen === 'function' ? action.visibleWhen(record) : true
    );
  }, [rowActions, record]);

  const handleAction = async (action: RowAction<TRecord, TFilters>) => {
    if (action.disabled?.({ record, context })) return;
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
    return <span aria-hidden="true">–</span>;
  }

  return (
    <div className="flex gap-2">
      {visibleActions.map((action) => (
        <Button
          key={action.id}
          type="button"
          size="sm"
          variant={(action.buttonVariant as never) ?? 'ghost'}
          onClick={() => handleAction(action)}
          disabled={action.disabled?.({ record, context }) ?? false}
        >
          {renderLabel(action)}
        </Button>
      ))}
    </div>
  );
}
