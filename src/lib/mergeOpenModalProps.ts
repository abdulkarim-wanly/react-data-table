import type { DataTableActionsContext, FilterValues } from '../tableTypes';

/**
 * Builds the second argument to `onOpenModal`. Strips any `context` / `record` from
 * `payload.props` so placeholders from the consumer cannot replace the real table
 * context after merge (or interact badly with cloning / persistence).
 */
export function mergeOpenModalProps<TRecord, TFilters extends FilterValues>(
  payloadProps: Record<string, unknown> | undefined,
  context: DataTableActionsContext<TRecord, TFilters>,
  record?: TRecord
): Record<string, unknown> {
  const { context: _omitC, record: _omitR, ...rest } = (payloadProps ?? {}) as Record<
    string,
    unknown
  >;
  const out: Record<string, unknown> = {
    ...rest,
    context,
    /** Same reference as `context`; use if app code accidentally clears `context`. */
    dataTableContext: context,
  };
  if (record !== undefined) {
    out.record = record;
  }
  return out;
}
