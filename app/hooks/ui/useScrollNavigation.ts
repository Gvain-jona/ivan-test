'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseScrollNavigationReturn {
  showScrollTop: boolean;
  isScrollingDown: boolean;
  navVisible: boolean;
  scrollToTop: () => void;
}

/**
 * Custom hook to handle scroll-based navigation visibility
 */
export function useScrollNavigation(): UseScrollNavigationReturn {
  // State for scroll position and visibility
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  
  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Handle scroll events
  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Use throttling to limit how often the scroll handler runs
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Show/hide scroll to top button
          setShowScrollTop(currentScrollY > 300);
          
          // Detect scroll direction
          const isScrollDown = currentScrollY > lastScrollY;
          setIsScrollingDown(isScrollDown);
          
          // Auto-hide nav when scrolling down on long pages
          if (isScrollDown && currentScrollY > 100) {
            setNavVisible(false);
          } else {
            setNavVisible(true);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        
        ticking = true;
      }
      
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set a timeout to show the nav after scrolling stops
      scrollTimeout = setTimeout(() => {
        setNavVisible(true);
      }, 1000);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);
  
  return {
    showScrollTop,
    isScrollingDown,
    navVisible,
    scrollToTop
  };
}
