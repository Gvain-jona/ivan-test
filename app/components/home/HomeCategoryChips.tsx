'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Users, Boxes, Banknote, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chip {
  label: string;
  href: string;
  icon: LucideIcon;
}

const CHIPS: Chip[] = [
  { label: 'Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Products', href: '/dashboard/products', icon: Boxes },
  { label: 'Expenses', href: '/dashboard/expenses', icon: Banknote },
];

/**
 * Horizontally-scrolling quick-nav chips, mirroring the category pill
 * row in the inspiration set. Scrolls rather than wraps on narrow
 * phones; the scrollbar is hidden but swipe still works.
 */
export default function HomeCategoryChips() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="Quick navigation"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CHIPS.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
