'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Users,
  Banknote,
  Boxes,
  ShoppingBag,
  BarChart3,
  User,
  Settings,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OrderSheet from '@/components/ui/sheets/OrderSheet';

interface Destination {
  title: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
}

/**
 * Primary destinations — the four thumb-zone tabs. Kept deliberately
 * short (mobile bottom bars hold 4–5 max); everything else lives in the
 * More sheet. Reorder here to change what's promoted to the bar.
 */
const PRIMARY: Destination[] = [
  { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  { title: 'Clients', icon: Users, href: '/dashboard/clients' },
  { title: 'Expenses', icon: Banknote, href: '/dashboard/expenses' },
];

/** Secondary destinations — revealed from the More sheet. */
const MORE: Destination[] = [
  { title: 'Products', icon: Boxes, href: '/dashboard/products' },
  { title: 'Material', icon: ShoppingBag, href: '/dashboard/material-purchases' },
  { title: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', disabled: true },
  { title: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { title: 'Profile', icon: User, href: '/dashboard/profile' },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Mobile-only bottom tab bar (`lg:hidden`). A real phone tab bar —
 * full-width, safe-area aware, 4 primary tabs + a More sheet — as
 * opposed to the desktop floating pill (rendered separately in
 * FooterNav). This is the platform-adaptation the shell was missing:
 * the two navs are different experiences, not one restyled.
 */
export default function MobileTabBar() {
  const pathname = usePathname() ?? '';
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MORE.some((d) => isActive(pathname, d.href));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex items-stretch justify-around">
          {PRIMARY.map(({ title, icon: Icon, href }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
                  isActive(pathname, href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                {title}
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex min-h-[56px] w-full flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
                moreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={2} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <OrderSheet open={moreOpen} onOpenChange={setMoreOpen} title="More">
        <div className="grid grid-cols-3 gap-3 p-4">
          {MORE.map(({ title, icon: Icon, href, disabled }) => {
              const active = isActive(pathname, href);
              const tile = (
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center text-xs font-medium transition-colors',
                    disabled
                      ? 'cursor-not-allowed border-border bg-muted/40 text-muted-foreground/50'
                      : active
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {title}
                  {disabled && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  )}
                </div>
              );

              return disabled ? (
                <div key={href} aria-disabled>
                  {tile}
                </div>
              ) : (
                <Link key={href} href={href} onClick={() => setMoreOpen(false)}>
                  {tile}
                </Link>
              );
            })}
        </div>
      </OrderSheet>
    </>
  );
}
