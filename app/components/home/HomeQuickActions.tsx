'use client';

import { UserPlus, PackagePlus, type LucideIcon } from 'lucide-react';
import { useSheets } from '@/context/sheet-host';

/**
 * Quick-action chips — the repurposed chip row. Where the old chips just
 * duplicated the bottom tab bar's destinations, these are secondary *create*
 * shortcuts (the primary create-order action lives in the hero's add bar).
 * They open the relevant create sheet **in place** via the sheet host (no
 * navigation). Scrolls rather than wraps on narrow phones.
 */
export default function HomeQuickActions() {
  const { openCreateClient, openCreateProduct } = useSheets();

  const actions: { label: string; icon: LucideIcon; onClick: () => void }[] = [
    { label: 'New client', icon: UserPlus, onClick: openCreateClient },
    { label: 'New product', icon: PackagePlus, onClick: openCreateProduct },
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </button>
      ))}
    </div>
  );
}
