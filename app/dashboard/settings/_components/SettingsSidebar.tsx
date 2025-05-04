'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette,
  Bell,
  Database,
  Users,
  Calculator,
  Wallet,
  ChevronRight,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the navigation items for settings
const settingsNavItems = [
  {
    href: '/dashboard/settings/appearance',
    icon: Palette,
    label: 'Appearance & Layout'
  },
  {
    href: '/dashboard/settings/notifications',
    icon: Bell,
    label: 'Notifications'
  },
  {
    href: '/dashboard/settings/announcements',
    icon: Megaphone,
    label: 'Announcements'
  },
  {
    href: '/dashboard/settings/data-privacy',
    icon: Database,
    label: 'Data & Privacy'
  },
  {
    href: '/dashboard/settings/user-management',
    icon: Users,
    label: 'User Management'
  },
  {
    href: '/dashboard/settings/profit',
    icon: Calculator,
    label: 'Profit Settings'
  },
  {
    href: '/dashboard/settings/accounts',
    icon: Wallet,
    label: 'Accounts'
  },
];

interface SettingsSidebarProps {
  className?: string;
}

export function SettingsSidebar({ className }: SettingsSidebarProps) {
  const pathname = usePathname();

  // Check if the current path matches a nav item
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className={cn(
      "w-64 border-r border-border/60 h-full overflow-y-auto bg-card/80 backdrop-blur-sm",
      className
    )}>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <nav>
          <ul className="space-y-1">
            {settingsNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
