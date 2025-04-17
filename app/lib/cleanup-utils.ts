'use client';

/**
 * Cleanup utilities for managing cached data and improving application performance
 * These utilities help clean up localStorage, SWR cache, and other in-memory caches
 */

import { mutate } from 'swr';

// Types of data that can be cleaned up
export type CleanupTarget = 
  | 'all'               // All cached data
  | 'localStorage'      // All localStorage data
  | 'dropdowns'         // Dropdown cache data
  | 'forms'             // Form state data
  | 'orders'            // Orders data
  | 'swr'               // SWR cache
  | 'auth';             // Auth-related data (excluding active session)

/**
 * Cleans up localStorage data based on the specified target
 * @param target The type of data to clean up
 * @returns The number of items removed
 */
export function cleanupLocalStorage(target: CleanupTarget = 'all'): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    let removedCount = 0;
    
    // Define prefixes for different types of data
    const prefixMap: Record<CleanupTarget, string[]> = {
      all: [
        'cache_', 'dropdown_cache_', 'form_', 'order-form-', 
        'recent-', 'item-form-', 'payment-form-', 'note-form-'
      ],
      localStorage: [
        'cache_', 'dropdown_cache_', 'form_', 'order-form-', 
        'recent-', 'item-form-', 'payment-form-', 'note-form-'
      ],
      dropdowns: ['dropdown_cache_', 'recent-', 'cache_dropdown'],
      forms: ['form_', 'order-form-', 'item-form-', 'payment-form-', 'note-form-'],
      orders: ['order-', 'cache_orders'],
      swr: ['cache_'],
      auth: ['auth_', 'pin_verified', 'sb-']
    };
    
    // Get the prefixes for the specified target
    const prefixes = prefixMap[target] || [];
    
    // Special handling for auth target - don't remove active session
    const isAuthTarget = target === 'auth' || target === 'all';
    const activeSessionKey = localStorage.getItem('sb-auth');
    
    // Remove items that match our prefixes
    keys.forEach(key => {
      // Skip the active session key if we're cleaning auth data
      if (isAuthTarget && key === 'sb-auth' && activeSessionKey) {
        return;
      }
      
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });
    
    console.log(`Cleaned up ${removedCount} localStorage items for target: ${target}`);
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up localStorage:', error);
    return 0;
  }
}

/**
 * Cleans up SWR cache for specific patterns
 * @param patterns Array of key patterns to match (e.g., '/api/orders')
 */
export function cleanupSWRCache(patterns: string[] = []): void {
  try {
    if (patterns.length === 0) {
      // Clear all SWR cache
      mutate(
        () => true, // Match all keys
        undefined,  // Force revalidation
        { revalidate: false }
      );
      console.log('Cleared all SWR cache');
    } else {
      // Clear specific patterns
      patterns.forEach(pattern => {
        mutate(
          key => typeof key === 'string' && key.includes(pattern),
          undefined,
          { revalidate: false }
        );
      });
      console.log(`Cleared SWR cache for patterns: ${patterns.join(', ')}`);
    }
  } catch (error) {
    console.error('Error cleaning up SWR cache:', error);
  }
}

/**
 * Comprehensive cleanup function that handles all types of cached data
 * @param target The type of data to clean up
 * @returns Object with counts of items removed
 */
export function performCleanup(target: CleanupTarget = 'all'): { 
  localStorageCount: number 
} {
  // Clean up localStorage
  const localStorageCount = cleanupLocalStorage(target);
  
  // Clean up SWR cache based on target
  const swrPatterns: Record<CleanupTarget, string[]> = {
    all: [],  // Empty array means clear all
    localStorage: [],
    dropdowns: ['/api/dropdown', '/api/clients', '/api/categories', '/api/items'],
    forms: [],
    orders: ['/api/orders'],
    swr: [],
    auth: ['/api/auth', '/api/profile']
  };
  
  cleanupSWRCache(swrPatterns[target] || []);
  
  return {
    localStorageCount
  };
}

/**
 * Gets the size of localStorage in bytes
 * @returns The size in bytes
 */
export function getLocalStorageSize(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      if (value) {
        // Each character in localStorage is 2 bytes
        totalSize += (key.length + value.length) * 2;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating localStorage size:', error);
    return 0;
  }
}

/**
 * Gets a summary of localStorage usage
 * @returns Object with size and item counts by category
 */
export function getStorageSummary(): {
  totalSize: number;
  totalItems: number;
  categories: Record<string, { count: number; size: number }>;
} {
  if (typeof window === 'undefined') {
    return { totalSize: 0, totalItems: 0, categories: {} };
  }
  
  try {
    let totalSize = 0;
    let totalItems = 0;
    const categories: Record<string, { count: number; size: number }> = {
      dropdowns: { count: 0, size: 0 },
      forms: { count: 0, size: 0 },
      cache: { count: 0, size: 0 },
      auth: { count: 0, size: 0 },
      other: { count: 0, size: 0 }
    };
    
    // Category patterns
    const categoryPatterns: Record<string, string[]> = {
      dropdowns: ['dropdown_cache_', 'recent-'],
      forms: ['form_', 'order-form-', 'item-form-', 'payment-form-', 'note-form-'],
      cache: ['cache_'],
      auth: ['auth_', 'pin_verified', 'sb-']
    };
    
    // Process each localStorage item
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      if (!value) continue;
      
      // Calculate size (2 bytes per character)
      const itemSize = (key.length + value.length) * 2;
      totalSize += itemSize;
      totalItems++;
      
      // Categorize the item
      let categorized = false;
      for (const [category, patterns] of Object.entries(categoryPatterns)) {
        if (patterns.some(pattern => key.startsWith(pattern))) {
          categories[category].count++;
          categories[category].size += itemSize;
          categorized = true;
          break;
        }
      }
      
      // If not categorized, put in "other"
      if (!categorized) {
        categories.other.count++;
        categories.other.size += itemSize;
      }
    }
    
    return { totalSize, totalItems, categories };
  } catch (error) {
    console.error('Error generating storage summary:', error);
    return { totalSize: 0, totalItems: 0, categories: {} };
  }
}

/**
 * Formats a byte size into a human-readable string
 * @param bytes The size in bytes
 * @returns Formatted string (e.g., "1.5 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
