'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/context/navigation-context';

// Define navigation item types
export type NavItem = {
  title: string;
  icon: React.ComponentType;
  href: string;
  isContextMenu?: boolean;
  menuType?: 'notifications' | 'search' | 'profile';
  useDirectLink?: boolean; // Flag to use direct link navigation instead of router
  badge?: number;
  type?: never;
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
  handleTabChange: (index: number | null, event?: React.MouseEvent) => void;
  findContextMenuIndex: (menuType: 'notifications' | 'search' | 'profile' | null) => number;
}

/**
 * Custom hook to manage tab navigation
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

  // Restore active tab from sessionStorage on initial load
  useEffect(() => {
    // Only run on initial mount
    const storedTabIndex = sessionStorage.getItem('lastActiveTabIndex');
    if (storedTabIndex !== null) {
      const index = parseInt(storedTabIndex, 10);
      if (!isNaN(index) && index >= 0 && index < navigationItems.length) {
        setActiveTab(index);
        // Clear the stored index after restoring
        sessionStorage.removeItem('lastActiveTabIndex');
      }
    }
  }, [navigationItems.length]);

  // Find the index of the active context menu item (if any)
  const findContextMenuIndex = useCallback((menuType: 'notifications' | 'search' | 'profile' | null) => {
    if (!menuType) return -1;
    return navigationItems.findIndex(
      (item) => 'isContextMenu' in item && item.isContextMenu && item.menuType === menuType
    );
  }, [navigationItems]);

  // Handle tab change with support for direct links
  const handleTabChange = useCallback((index: number | null, event?: React.MouseEvent) => {
    if (index !== null && 'href' in navigationItems[index]) {
      const item = navigationItems[index];

      if (item.isContextMenu) {
        // Set active tab to this context menu item for visual feedback
        setActiveTab(index);
      } else if (item.href !== '#') {
        // Set active tab immediately for visual feedback
        setActiveTab(index);

        // Check if this item should use direct link navigation
        if (item.useDirectLink) {
          // Use direct window.location navigation for problematic routes
          console.log(`Using direct navigation for ${item.href}`);
          // Store the active tab index in sessionStorage before navigation
          sessionStorage.setItem('lastActiveTabIndex', index.toString());
          window.location.href = item.href;
        } else {
          // Use normal router navigation
          startNavigation(item.href as string);
        }
      }
    }
  }, [navigationItems, startNavigation]);

  // Initialize with the active tab from URL and ensure it persists
  useEffect(() => {
    // Always update the active tab based on the current URL
    // This ensures the navigation state is always in sync with the URL
    if (activeTabIndex !== -1) {
      setActiveTab(activeTabIndex);
    }
  }, [activeTabIndex]);

  // Use active tab or fallback to activeTabIndex or active context menu
  const contextMenuIndex = findContextMenuIndex(activeMenu);
  const initialTab = activeTab !== null ? activeTab :
                    (contextMenuOpen && contextMenuIndex !== -1) ? contextMenuIndex :
                    (activeTabIndex !== -1) ? activeTabIndex : null;

  return {
    activeTab,
    activeTabIndex,
    initialTab,
    handleTabChange,
    findContextMenuIndex
  };
}
