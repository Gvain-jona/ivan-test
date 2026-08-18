'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Users,
  Banknote,
  Bell,
  Boxes,
  FileText,
  ShoppingBag,
  BarChart3,
  Building2,
  User,
  Settings,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationsContext';
import AppSheet from '@/components/ui/sheets/AppSheet';

interface Destination {
  title: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
}

/**
 * Primary destinations — the thumb-zone tabs, in the canvas's order: Home,
 * Orders, Clients, then Alerts and More. Alerts routes to the full-screen
 * notifications inbox (/dashboard/notifications) — it carries a badge and lights
 * when active, so it's rendered inline rather than from this list.
 * Documents moved to the More sheet to make its slot — the frame promotes
 * Alerts there.
 */
const PRIMARY: Destination[] = [
  { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  { title: 'Clients', icon: Users, href: '/dashboard/clients' },
];

/**
 * Secondary destinations — revealed from the More sheet.
 *
 * The modules still on the legacy `public` schema are marked disabled rather
 * than hidden: they're coming back at their own cutovers, and a tile that says
 * "Soon" is a truer account of the app than a link that loads a page whose
 * every request 401s.
 */
const MORE: Destination[] = [
  { title: 'Documents', icon: FileText, href: '/dashboard/documents' },
  { title: 'Products', icon: Boxes, href: '/dashboard/products' },
  { title: 'Expenses', icon: Banknote, href: '/dashboard/expenses', disabled: true },
  { title: 'Material', icon: ShoppingBag, href: '/dashboard/material-purchases', disabled: true },
  { title: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', disabled: true },
  { title: 'Organization', icon: Building2, href: '/dashboard/organization' },
  { title: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { title: 'Profile', icon: User, href: '/dashboard/profile' },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** One pill item — icon over label, brand-coloured when active. */
function TabItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <span
      className={cn(
        'relative flex flex-col items-center gap-[3px] rounded-full px-3 py-1.5 text-[10.5px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
      {label}
      {badge != null && badge > 0 && (
        <span className="absolute right-1.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </span>
  );
}

/**
 * Mobile-only bottom nav (`lg:hidden`) — the canvas's floating pill: Home,
 * Orders, Clients, Alerts, More, centered and detached from the screen edges
 * with a safe-area gap beneath. Alerts routes to the notifications inbox; More
 * opens the secondary sheet. The desktop nav is the separate expandable pill in
 * FooterNav.
 */
export default function MobileTabBar() {
  const pathname = usePathname() ?? '';
  const [moreOpen, setMoreOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const moreActive = MORE.some((d) => isActive(pathname, d.href));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
      >
        <div className="flex items-stretch gap-0.5 rounded-full border border-border bg-card/95 px-1.5 py-1.5 shadow-lg backdrop-blur-md">
          {PRIMARY.map(({ title, icon, href }) => (
            <Link key={href} href={href} aria-current={isActive(pathname, href) ? 'page' : undefined}>
              <TabItem icon={icon} label={title} active={isActive(pathname, href)} />
            </Link>
          ))}
          <Link
            href="/dashboard/notifications"
            aria-current={isActive(pathname, '/dashboard/notifications') ? 'page' : undefined}
            aria-label="Alerts"
          >
            <TabItem
              icon={Bell}
              label="Alerts"
              active={isActive(pathname, '/dashboard/notifications')}
              badge={unreadCount}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-label="More"
          >
            <TabItem icon={MoreHorizontal} label="More" active={moreActive} />
          </button>
        </div>
      </nav>

      <AppSheet open={moreOpen} onOpenChange={setMoreOpen} title="More">
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
      </AppSheet>
    </>
  );
}
