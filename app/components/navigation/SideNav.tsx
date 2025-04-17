'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Banknote,
  ShoppingBag,
  CheckSquare,
  BarChart3,
  Settings,
  User,
  X,
  LogOut,
  HelpCircle,
  Home,
  ChevronRight,
  Menu,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Define navigation items
const navigationItems = [
  { href: '/dashboard/home', icon: Home, label: 'Home' },
  { href: '/dashboard/orders', icon: Package, label: 'Orders' },
  { href: '/dashboard/expenses', icon: Banknote, label: 'Expenses' },
  { href: '/dashboard/material-purchases', icon: ShoppingBag, label: 'Material Purchases' },
  { href: '/dashboard/todo', icon: CheckSquare, label: 'To-Do' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

type SideNavProps = {
  className?: string;
  onClose?: () => void;
};

export default function SideNav({ className, onClose }: SideNavProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, profile } = useAuth();

  // Handle responsive behavior
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsCollapsed(false); // Reset collapsed state on mobile
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Toggle sidebar collapse state (only used on desktop)
  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Helper function to check if a route is active
  const isRouteActive = (href: string) => {
    if (pathname === href) return true;
    if (href !== '/dashboard/home' && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <aside
      className={cn(
        "sidebar flex flex-col z-30 transition-all duration-300 border-r border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/80 backdrop-blur-sm",
        isCollapsed ? "w-16" : (isMobile ? "w-64" : "w-64"),
        isMobile && "absolute inset-y-0 left-0",
        className
      )}
    >
      {/* Close button for mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-800/50 z-50"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Collapse toggle for desktop */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="absolute top-3 right-3 hover:bg-gray-800/50 z-50"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Logo */}
      <div className={cn(
        "p-4 transition-all duration-300",
        isCollapsed && "flex justify-center"
      )}>
        <Link href="/dashboard/orders" className={cn(
          "flex items-center gap-2",
          isCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            IP
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-foreground">Ivan Prints</h1>
              <p className="text-xs text-muted-foreground">Business Management</p>
            </div>
          )}
        </Link>
      </div>

      <Separator className="my-2" />

      {/* Main section label */}
      {!isCollapsed && (
        <div className="px-4 py-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Main</p>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="space-y-1">
          {navigationItems.slice(0, 6).map((item) => (
            <li key={item.href}>
              {isCollapsed ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavLink
                        href={item.href}
                        icon={<item.icon className="h-4 w-4" />}
                        label={item.label}
                        isActive={isRouteActive(item.href)}
                        onClick={onClose}
                        isCollapsed={true}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <NavLink
                  href={item.href}
                  icon={<item.icon className="h-4 w-4" />}
                  label={item.label}
                  isActive={isRouteActive(item.href)}
                  onClick={onClose}
                  isCollapsed={false}
                />
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Sales channels section */}
      {!isCollapsed && (
        <div className="px-4 py-2 mt-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Sales Channels</p>
        </div>
      )}

      <nav className="px-2 mb-2">
        <ul className="space-y-1">
          <li>
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      href="/dashboard/facebook"
                      icon={<div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">f</div>}
                      label="Facebook"
                      isActive={isRouteActive('/dashboard/facebook')}
                      onClick={onClose}
                      isCollapsed={true}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Facebook
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <NavLink
                href="/dashboard/facebook"
                icon={<div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">f</div>}
                label="Facebook"
                isActive={isRouteActive('/dashboard/facebook')}
                onClick={onClose}
                isCollapsed={false}
              />
            )}
          </li>
          <li>
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      href="/dashboard/store"
                      icon={<div className="h-4 w-4 rounded flex items-center justify-center text-primary">🛒</div>}
                      label="Online Store"
                      isActive={isRouteActive('/dashboard/store')}
                      onClick={onClose}
                      isCollapsed={true}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Online Store
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <NavLink
                href="/dashboard/store"
                icon={<div className="h-4 w-4 rounded flex items-center justify-center text-primary">🛒</div>}
                label="Online Store"
                isActive={isRouteActive('/dashboard/store')}
                onClick={onClose}
                isCollapsed={false}
              />
            )}
          </li>
          <li>
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      href="/dashboard/instagram"
                      icon={<div className="h-4 w-4 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">i</div>}
                      label="Instagram"
                      isActive={isRouteActive('/dashboard/instagram')}
                      onClick={onClose}
                      isCollapsed={true}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Instagram
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <NavLink
                href="/dashboard/instagram"
                icon={<div className="h-4 w-4 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">i</div>}
                label="Instagram"
                isActive={isRouteActive('/dashboard/instagram')}
                onClick={onClose}
                isCollapsed={false}
              />
            )}
          </li>
        </ul>
      </nav>

      <div className="mt-auto p-4">
        <Separator className="my-2" />

        {/* User profile section */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60 transition-colors",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src="/avatar.jpg" alt={profile?.full_name || 'User'} />
            <AvatarFallback className="bg-gradient-to-r from-primary to-orange-600 text-white">
              {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name || 'Loading...'}
                </p>
                {/* Refresh button */}
                {useAuth().refreshProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      useAuth().refreshProfile?.();
                    }}
                    title="Refresh profile"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || user?.email || 'Loading...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// Sub-component for navigation links
type NavLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
  isCollapsed?: boolean;
};

function NavLink({ href, icon, label, isActive, className, onClick, isCollapsed = false }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
        isActive ?
          "text-primary bg-primary/10 font-semibold" :
          "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        isCollapsed && "justify-center px-2",
        className
      )}
      onClick={onClick}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <span className={cn(
        "flex items-center justify-center",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className="truncate">{label}</span>
      )}
      {isActive && !isCollapsed && (
        <ChevronRight className="ml-auto h-4 w-4 text-primary/50" />
      )}
    </Link>
  );
}