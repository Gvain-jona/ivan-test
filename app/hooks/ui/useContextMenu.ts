'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type MenuType = 'notifications' | 'search' | 'profile' | null;
type Position = { x: number; y: number } | null;

interface UseContextMenuReturn {
  activeMenu: MenuType;
  contextMenuOpen: boolean;
  clickPosition: Position;
  navWidth: number;
  openMenu: (menuType: MenuType, event?: React.MouseEvent) => void;
  closeMenu: () => void;
  toggleMenu: (menuType: MenuType, event?: React.MouseEvent) => void;
}

/**
 * Custom hook to manage context menu state and functionality
 */
export function useContextMenu(): UseContextMenuReturn {
  // State for context menu
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<Position>(null);
  const [navWidth, setNavWidth] = useState<number>(0);

  // Ref for the navigation element
  const navRef = useRef<HTMLDivElement>(null);

  // Measure the width of the navigation element
  useEffect(() => {
    const measureNavWidth = () => {
      if (navRef.current) {
        const width = navRef.current.offsetWidth;
        setNavWidth(width);
      }
    };

    // Measure on mount
    measureNavWidth();

    // Measure on window resize
    window.addEventListener('resize', measureNavWidth);

    return () => {
      window.removeEventListener('resize', measureNavWidth);
    };
  }, []);

  // Open the context menu
  const openMenu = useCallback((menuType: MenuType, event?: React.MouseEvent) => {
    if (!menuType) return;

    setActiveMenu(menuType);
    setContextMenuOpen(true);

    // Calculate position for the context menu
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const newPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top
      };
      setClickPosition(newPosition);
    }
  }, []);

  // Close the context menu
  const closeMenu = useCallback(() => {
    setContextMenuOpen(false);

    // We no longer reset the activeMenu to maintain the visual state
    // This allows the footer nav to keep track of which contextual menu was last opened
  }, []);

  // Toggle the context menu
  const toggleMenu = useCallback((menuType: MenuType, event?: React.MouseEvent) => {
    if (activeMenu === menuType && contextMenuOpen) {
      // If clicking the same menu that's already open, close it
      closeMenu();
    } else if (contextMenuOpen && activeMenu !== null && activeMenu !== menuType) {
      // If switching from one menu to another, update directly without closing first
      // This ensures smooth transition between different contextual menus
      setActiveMenu(menuType);

      // Calculate position for the context menu
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const newPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top
        };
        setClickPosition(newPosition);
      }

      // Make sure the menu is open (in case it was in the process of closing)
      setContextMenuOpen(true);
    } else {
      // Normal opening of a menu
      openMenu(menuType, event);
    }
  }, [activeMenu, contextMenuOpen, openMenu, closeMenu]);

  return {
    activeMenu,
    contextMenuOpen,
    clickPosition,
    navWidth,
    openMenu,
    closeMenu,
    toggleMenu
  };
}
