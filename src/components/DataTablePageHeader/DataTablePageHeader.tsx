import React from 'react';
import type { ReactNode } from 'react';

import {
  mergeDataTableClassNames,
  type DataTableClassNames,
} from '../../dataTableLayout';

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ').trim();
}

export type DataTablePageHeaderClassNames = Partial<
  Pick<
    DataTableClassNames,
    'headerCard' | 'pageHeaderWrapper' | 'pageTitle' | 'pageSubtitle' | 'actionsWrapper'
  >
>;

/**
 * Standalone page header (title, subtitle, right slot) with the same layout tokens
 * as {@link DataTableLayoutComponents.PageHeader}. Use it on any page without `DataTable`.
 */
export interface DataTablePageHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
  /** Merged with {@link DEFAULT_DATA_TABLE_CLASSNAMES} when keys are omitted. */
  classNames?: DataTablePageHeaderClassNames;
}

export function DataTablePageHeader({
  title,
  subtitle,
  rightSlot,
  classNames: partial,
}: DataTablePageHeaderProps) {
  const defaults = mergeDataTableClassNames();
  const c = {
    headerCard: partial?.headerCard ?? defaults.headerCard,
    pageHeaderWrapper: partial?.pageHeaderWrapper ?? defaults.pageHeaderWrapper,
    pageTitle: partial?.pageTitle ?? defaults.pageTitle,
    pageSubtitle: partial?.pageSubtitle ?? defaults.pageSubtitle,
    actionsWrapper: partial?.actionsWrapper ?? defaults.actionsWrapper,
  };

  const hasTitleBlock = Boolean(title || subtitle);

  return (
    <div className={joinClasses(c.headerCard)}>
      {hasTitleBlock ? (
        <div className={joinClasses(c.pageHeaderWrapper)}>
          {title ? <h2 className={joinClasses(c.pageTitle)}>{title}</h2> : null}
          {subtitle ? <p className={joinClasses(c.pageSubtitle)}>{subtitle}</p> : null}
        </div>
      ) : null}
      {rightSlot ? <div className={joinClasses(c.actionsWrapper)}>{rightSlot}</div> : null}
    </div>
  );
}
