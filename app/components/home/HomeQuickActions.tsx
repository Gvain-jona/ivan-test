'use client';

import { FileText, Plus, UserPlus, type LucideIcon } from 'lucide-react';
import { useSheets } from '@/context/sheet-host';

/**
 * The three quick-create chips from the H1 frame: New order, New client, New
 * quote. Each opens the relevant create surface — client in a sheet, order and
 * quote via the order composer (an order starts in the quotation stage, so
 * "New quote" is the same composer named for the intent you arrive with). "New
 * order" carries the brand fill as the primary action; the others are outline.
 * Scrolls rather than wraps on narrow phones.
 */
export default function HomeQuickActions() {
  const { openCreateOrder, openCreateClient } = useSheets();

  const actions: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    primary?: boolean;
  }[] = [
    { label: 'New order', icon: Plus, onClick: openCreateOrder, primary: true },
    { label: 'New client', icon: UserPlus, onClick: () => openCreateClient() },
    { label: 'New quote', icon: FileText, onClick: openCreateOrder },
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map(({ label, icon: Icon, onClick, primary }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className={
            primary
              ? 'flex flex-shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground'
              : 'flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted'
          }
        >
          <Icon className={primary ? 'h-4 w-4' : 'h-4 w-4 text-primary'} />
          {label}
        </button>
      ))}
    </div>
  );
}
