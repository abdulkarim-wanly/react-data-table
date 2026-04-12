import React from 'react';
import type { FilterValues, ModalRegistryHandler } from '../tableTypes';
import type { DataTableActionsContext } from '../tableTypes';
import { isModalPayload } from '../tableTypes';
import type { TableAction } from '../components/ActionButtonsBar/ActionButtonsBar';
import type { RowAction } from '../components/UserActionCell/UserActionCell';
import type { OpenModalCallback } from '../tableTypes';
import { mergeOpenModalProps } from '../lib/mergeOpenModalProps';

export interface UseModalRegistryArgs<TRecord, TFilters extends FilterValues> {
  tableId: string;
  actions?: TableAction<TRecord, TFilters>[];
  rowActions?: RowAction<TRecord, TFilters>[];
  onOpenModal?: OpenModalCallback;
  onRegisterModal?: (registry: Record<string, ModalRegistryHandler<TRecord, TFilters>>) => void;
}

export function useModalRegistry<TRecord, TFilters extends FilterValues = FilterValues>({
  tableId,
  actions,
  rowActions,
  onOpenModal,
  onRegisterModal,
}: UseModalRegistryArgs<TRecord, TFilters>) {
  const registryMap = React.useMemo(() => {
    const map: Record<string, ModalRegistryHandler<TRecord, TFilters>> = {};

    (actions || []).forEach((a) => {
      if (a?.openModal) {
        const openModal = a.openModal;
        map[`${tableId}:action:${a.id}`] = async ({
          context,
        }: {
          context: DataTableActionsContext<TRecord, TFilters>;
        }) => {
          const payload = await Promise.resolve(openModal({ context }));
          if (isModalPayload(payload) && onOpenModal) {
            onOpenModal(
              payload.type,
              mergeOpenModalProps(payload.props as Record<string, unknown> | undefined, context)
            );
          }
        };
      }
    });

    (rowActions || []).forEach((a) => {
      if (a?.openModal) {
        const openModal = a.openModal;
        map[`${tableId}:rowAction:${a.id}`] = async (args) => {
          if (!('record' in args)) return;
          const { context, record } = args as {
            context: DataTableActionsContext<TRecord, TFilters>;
            record: TRecord;
          };
          const payload = await Promise.resolve(openModal({ record, context }));
          if (isModalPayload(payload) && onOpenModal) {
            onOpenModal(
              payload.type,
              mergeOpenModalProps(
                payload.props as Record<string, unknown> | undefined,
                context,
                record
              )
            );
          }
        };
      }
    });

    return map;
  }, [actions, rowActions, tableId, onOpenModal]);

  React.useEffect(() => {
    onRegisterModal?.(registryMap);
  }, [registryMap, onRegisterModal]);

  return registryMap;
}
