'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/context/navigation-context';

// Define navigation item types
export type NavItem = {
  title: string;
  icon: React.ComponentType | (() => JSX.Element);
  href: string;
  isContextMenu?: boolean;
  menuType?: 'notifications' | 'search' | 'profile';
  // Removed useDirectLink flag in favor of a more consistent approach
  badge?: number;
  type?: never;
  // New property to identify routes that might need special handling
  isExternalRoute?: boolean;
  // New property to disable navigation for specific routes
  disabled?: boolean;
};

export type NavSeparator = {
  type: 'separator';
  title?: never;
  icon?: never;
  href?: never;
  isContextMenu?: never;
  menuType?: never;
};

export type NavItemType = NavItem | NavSeparator;

interface UseTabNavigationProps {
  navigationItems: NavItemType[];
  activeMenu: 'notifications' | 'search' | 'profile' | null;
  contextMenuOpen: boolean;
}

interface UseTabNavigationReturn {
  activeTab: number | null;
  activeTabIndex: number;
  initialTab: number | null;
  activeContextMenuTab: number | null;
  handleTabChange: (index: number | null, event?: React.MouseEvent) => void;
  findContextMenuIndex: (menuType: 'notifications' | 'search' | 'profile' | null) => number;
}

/**
 * Custom hook to manage tab navigation with improved consistency
 */
export function useTabNavigation({
  navigationItems,
  activeMenu,
  contextMenuOpen
}: UseTabNavigationProps): UseTabNavigationReturn {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();

  // State for active tab
  const [activeTab, setActiveTab] = useState<number | null>(null);

  // Find the active tab index based on the current pathname
  const activeTabIndex = navigationItems.findIndex(
    (item) => 'href' in item && item.href && item.href !== '#' && pathname.startsWith(item.href)
  );

  // Find the index of the active context menu item (if any)
  const findContextMenuIndex = useCallback((menuType: 'notifications' | 'search' | 'profile' | null) => {
    if (!menuType) return -1;
    return navigationItems.findIndex(
      (item) => 'isContextMenu' in item && item.isContextMenu && item.menuType === menuType
    );
  }, [navigationItems]);

  // Enhanced tab change handler with improved navigation handling
  const handleTabChange = useCallback((index: number | null, event?: React.MouseEvent) => {
    if (index !== null && 'href' in navigationItems[index]) {
      const item = navigationItems[index];
      const targetHref = item.href as string;

      // Skip navigation for disabled items
      if (item.disabled) {
        // Optionally provide feedback that the item is disabled
        console.log(`Navigation to ${targetHref} is currently disabled`);
        return;
      }

      // Skip navigation if we're already on the target page
      if (targetHref !== '#' && pathname === targetHref) {
        console.log(`Already on ${targetHref}, skipping navigation`);
        return;
      }

      if (item.isContextMenu) {
        // Set active tab to this context menu item for visual feedback
        setActiveTab(index);
      } else if (targetHref !== '#') {
        // Set active tab immediately for visual feedback
        setActiveTab(index);

        // Signal to parent component that we're navigating away
        if (contextMenuOpen) {
          // The actual closing is handled by the parent component
        }

        // Special handling for complex pages that might take longer to load
        if (targetHref === '/dashboard/expenses') {
          console.log('Starting navigation to expenses page with special handling');
        }

        // Special handling for material purchases page
        if (targetHref === '/dashboard/material-purchases') {
          console.log('Starting navigation to material purchases page with special handling');
        }

        // Use consistent navigation approach for all routes
        startNavigation(targetHref);
      }
    }
  }, [navigationItems, startNavigation, contextMenuOpen, pathname]);

  // Initialize with the active tab from URL and ensure it persists
  useEffect(() => {
    // Always update the active tab based on the current URL
    // This ensures the navigation state is always in sync with the URL
    if (activeTabIndex !== -1) {
      setActiveTab(activeTabIndex);
    }
  }, [activeTabIndex]);

  // Always prioritize the active tab from URL, but keep context menu visually active when open
  const contextMenuIndex = findContextMenuIndex(activeMenu);

  // Determine initial tab state
  const initialTab = activeTabIndex !== -1 ? activeTabIndex :
                    activeTab !== null ? activeTab : null;

  // The contextual menu tab is only considered active when the menu is open
  const activeContextMenuTab = (contextMenuOpen && contextMenuIndex !== -1) ? contextMenuIndex : null;

  return {
    activeTab,
    activeTabIndex,
    initialTab,
    activeContextMenuTab,
    handleTabChange,
    findContextMenuIndex
  };
}
