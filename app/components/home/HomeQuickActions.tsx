'use client';

import Link from 'next/link';
import { UserPlus, PackagePlus, type LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Quick-action chips — the repurposed chip row. Where the old chips just
 * duplicated the bottom tab bar's destinations, these are secondary *create*
 * shortcuts (the primary create-order action lives in the hero's add bar).
 * Each links to a module page's `?new=1` deep-link, which opens that page's
 * create sheet. Scrolls rather than wraps on narrow phones.
 */
const ACTIONS: QuickAction[] = [
  { label: 'New client', href: '/dashboard/clients?new=1', icon: UserPlus },
  { label: 'New product', href: '/dashboard/products?new=1', icon: PackagePlus },
];

export default function HomeQuickActions() {
  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </Link>
      ))}
    </div>
  );
}
