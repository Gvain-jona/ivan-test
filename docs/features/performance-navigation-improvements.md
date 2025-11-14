# Performance and Navigation Improvements

This document outlines a comprehensive plan to address two key issues in the application:

1. **Context Menu Implementation**: Properly implementing or removing contextual menu functionality
2. **Navigation Performance**: Fixing the significant lag when switching between pages

## Current Issues

### Context Menu Issues
- Context menu functionality was partially removed but still triggered on certain navigation items
- Code changes required page refresh to take effect
- Navigation items for search, notifications, and profile were pointing to non-existent routes

### Performance Issues
- Significant delay when loading pages
- Visible lag during navigation between sections
- Users clicking navigation items multiple times due to perceived non-responsiveness
- Issue present with both side navigation and footer navigation implementations

## Implementation Plan

### Phase 1: Context Menu Cleanup

#### 1.1 Remove Unused Components and References
- [x] Remove `ContextMenu.tsx` component
- [x] Remove imports of ContextMenu from FooterNav
- [x] Remove context menu-related state variables from FooterNav
- [x] Update navigation items to remove or comment out context menu triggers
- [x] Clean up unused imports (Bell, Search, User icons)

#### 1.2 Prepare for Future Implementation
- [ ] Create placeholder files for future context menu implementation
- [ ] Document the intended behavior of context menus for future reference
- [ ] Define clear API boundaries for the context menu component

### Phase 2: Immediate Performance Improvements

#### 2.1 Add Visual Feedback for Navigation
- [ ] Implement loading indicators during page transitions
  ```tsx
  // In FooterNav.tsx
  const [isNavigating, setIsNavigating] = useState(false);
  
  const handleTabChange = useCallback((index: number | null) => {
    if (index !== null && 'href' in navigationItems[index] && navigationItems[index].href !== '#') {
      setIsNavigating(true);
      router.push(navigationItems[index].href as string);
    }
  }, [router]);
  
  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);
  ```

- [ ] Add a global loading overlay or progress bar
  ```tsx
  // Create a new component: components/ui/navigation-progress.tsx
  'use client';
  
  import { usePathname, useSearchParams } from 'next/navigation';
  import { useEffect, useState } from 'react';
  import { cn } from '@/lib/utils';
  
  export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
      let timeout: NodeJS.Timeout;
      
      // Start progress
      setIsNavigating(true);
      setProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Complete progress
      timeout = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsNavigating(false);
          setProgress(0);
        }, 200);
      }, 500);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }, [pathname, searchParams]);
    
    if (!isNavigating) return null;
    
    return (
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-orange-500 z-50 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    );
  }
  ```

- [ ] Add the progress indicator to the layout
  ```tsx
  // In DashboardLayout.tsx
  import { NavigationProgress } from '@/components/ui/navigation-progress';
  
  export default function DashboardLayout({ children, className }: DashboardLayoutProps) {
    // ...
    return (
      <div className="min-h-screen bg-background">
        <NavigationProgress />
        {/* Rest of layout */}
      </div>
    );
  }
  ```

#### 2.2 Optimize the Navigation Component
- [ ] Memoize the FooterNav component to prevent unnecessary re-renders
  ```tsx
  // In FooterNav.tsx
  export default React.memo(function FooterNav({ className }: FooterNavProps) {
    // Component implementation
  });
  
  // In DashboardLayout.tsx
  import FooterNav from '../navigation/FooterNav';
  // No need for additional memoization as the component is already memoized
  ```

- [ ] Implement active state feedback immediately on click
  ```tsx
  // In FooterNav.tsx
  const handleTabChange = useCallback((index: number | null) => {
    if (index !== null && 'href' in navigationItems[index] && navigationItems[index].href !== '#') {
      // Apply active state immediately for visual feedback
      setActiveTab(index);
      // Then navigate
      router.push(navigationItems[index].href as string);
    }
  }, [router]);
  ```

### Phase 3: Data Fetching Optimization

#### 3.1 Implement SWR for Data Fetching
- [ ] Install SWR
  ```bash
  npm install swr
  ```

- [ ] Create a global SWR configuration
  ```tsx
  // In app/providers.tsx
  'use client';
  
  import { SWRConfig } from 'swr';
  
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.');
      error.message = await res.text();
      throw error;
    }
    return res.json();
  };
  
  export function Providers({ children }: { children: React.ReactNode }) {
    return (
      <SWRConfig 
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateIfStale: false,
          dedupingInterval: 60000, // 1 minute
        }}
      >
        {children}
      </SWRConfig>
    );
  }
  ```

- [ ] Wrap the application with the SWR provider
  ```tsx
  // In app/layout.tsx
  import { Providers } from './providers';
  
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }
  ```

- [ ] Implement SWR in data-heavy components
  ```tsx
  // Example for OrdersPage
  'use client';
  
  import useSWR from 'swr';
  import { OrdersTable } from '@/components/orders/OrdersTable';
  import { OrdersSkeleton } from '@/components/skeletons/OrdersSkeleton';
  
  export default function OrdersClientPage() {
    const { data, error, isLoading } = useSWR('/api/orders');
    
    if (isLoading) return <OrdersSkeleton />;
    if (error) return <div>Failed to load orders</div>;
    
    return <OrdersTable orders={data} />;
  }
  ```

#### 3.2 Create Skeleton Loaders for Key Pages
- [ ] Implement skeleton components for main pages
  ```tsx
  // components/skeletons/OrdersSkeleton.tsx
  export function OrdersSkeleton() {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-800 rounded animate-pulse" />
        <div className="h-12 w-full bg-gray-800 rounded animate-pulse" />
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 w-full bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  ```

### Phase 4: Code Splitting and Bundle Optimization

#### 4.1 Implement Dynamic Imports
- [ ] Use Next.js dynamic imports for page components
  ```tsx
  // In app/dashboard/orders/page.tsx
  import dynamic from 'next/dynamic';
  import { OrdersSkeleton } from '@/components/skeletons/OrdersSkeleton';
  
  const OrdersClientPage = dynamic(
    () => import('@/components/pages/OrdersClientPage'),
    {
      loading: () => <OrdersSkeleton />,
      ssr: false, // Disable server-side rendering for client components
    }
  );
  
  export default function OrdersPage() {
    return <OrdersClientPage />;
  }
  ```

#### 4.2 Analyze and Optimize Bundle Size
- [ ] Install and configure bundle analyzer
  ```bash
  npm install @next/bundle-analyzer
  ```

- [ ] Create a bundle analyzer configuration
  ```js
  // next.config.js
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  
  module.exports = withBundleAnalyzer({
    // Next.js config
  });
  ```

- [ ] Run bundle analysis
  ```bash
  ANALYZE=true npm run build
  ```

- [ ] Identify and optimize large dependencies

### Phase 5: Server Components and Streaming

#### 5.1 Convert Data-Heavy Pages to Server Components
- [ ] Implement server components for initial data loading
  ```tsx
  // app/dashboard/orders/page.tsx
  import { OrdersTable } from '@/components/orders/OrdersTable';
  import { fetchOrders } from '@/lib/data';
  
  export default async function OrdersPage() {
    // This runs on the server
    const orders = await fetchOrders();
    
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <OrdersTable initialData={orders} />
      </div>
    );
  }
  ```

#### 5.2 Implement React Suspense for Progressive Loading
- [ ] Use Suspense boundaries for progressive loading
  ```tsx
  // app/dashboard/orders/page.tsx
  import { Suspense } from 'react';
  import { OrdersTable } from '@/components/orders/OrdersTable';
  import { OrdersSkeleton } from '@/components/skeletons/OrdersSkeleton';
  import { fetchOrders } from '@/lib/data';
  
  export default function OrdersPage() {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <Suspense fallback={<OrdersSkeleton />}>
          <OrdersTableContainer />
        </Suspense>
      </div>
    );
  }
  
  async function OrdersTableContainer() {
    const orders = await fetchOrders();
    return <OrdersTable orders={orders} />;
  }
  ```

### Phase 6: Prefetching and Caching

#### 6.1 Implement Route Prefetching
- [ ] Add prefetching for likely navigation targets
  ```tsx
  // In FooterNav.tsx
  import { useRouter, usePathname } from 'next/navigation';
  import { useEffect } from 'react';
  
  export default function FooterNav() {
    const router = useRouter();
    const pathname = usePathname();
    
    // Prefetch adjacent routes
    useEffect(() => {
      // Find current index
      const currentIndex = navigationItems.findIndex(
        item => 'href' in item && pathname.startsWith(item.href)
      );
      
      if (currentIndex !== -1) {
        // Prefetch previous and next routes
        const prevIndex = currentIndex - 1;
        const nextIndex = currentIndex + 1;
        
        if (prevIndex >= 0 && 'href' in navigationItems[prevIndex]) {
          router.prefetch(navigationItems[prevIndex].href);
        }
        
        if (nextIndex < navigationItems.length && 'href' in navigationItems[nextIndex]) {
          router.prefetch(navigationItems[nextIndex].href);
        }
      }
    }, [pathname, router]);
    
    // Rest of component
  }
  ```

#### 6.2 Implement Local Storage Caching
- [ ] Cache frequently accessed data in local storage
  ```tsx
  // In lib/cache.ts
  export function getCachedData<T>(key: string, ttl = 60000): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return value as T;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }
  
  export function setCachedData<T>(key: string, value: T, ttl = 60000): void {
    try {
      const item = {
        value,
        expiry: Date.now() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }
  ```

### Phase 7: Testing and Measurement

#### 7.1 Implement Performance Monitoring
- [ ] Add performance measurement
  ```tsx
  // In app/layout.tsx
  'use client';
  
  import { useEffect } from 'react';
  import { usePathname, useSearchParams } from 'next/navigation';
  
  function PerformanceMonitor() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    useEffect(() => {
      // Mark navigation start
      performance.mark('navigation-start');
      
      // Use requestAnimationFrame to measure when the page is visually complete
      const raf = requestAnimationFrame(() => {
        // Mark navigation end
        performance.mark('navigation-end');
        
        // Measure navigation duration
        performance.measure('navigation', 'navigation-start', 'navigation-end');
        
        // Log the measurement
        const navigationMeasure = performance.getEntriesByName('navigation')[0];
        console.log(`Navigation to ${pathname} took ${navigationMeasure.duration.toFixed(2)}ms`);
        
        // Clear marks and measures
        performance.clearMarks();
        performance.clearMeasures();
      });
      
      return () => cancelAnimationFrame(raf);
    }, [pathname, searchParams]);
    
    return null;
  }
  
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body>
          <PerformanceMonitor />
          {children}
        </body>
      </html>
    );
  }
  ```

#### 7.2 Implement A/B Testing for Performance Improvements
- [ ] Create an A/B testing framework for performance improvements
  ```tsx
  // In lib/ab-testing.ts
  type Variant = 'A' | 'B';
  
  export function getVariant(testName: string): Variant {
    // Check if variant is already assigned
    const storedVariant = localStorage.getItem(`ab-test-${testName}`);
    if (storedVariant === 'A' || storedVariant === 'B') {
      return storedVariant;
    }
    
    // Assign new variant
    const variant: Variant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(`ab-test-${testName}`, variant);
    return variant;
  }
  
  export function trackEvent(testName: string, eventName: string, data?: any) {
    const variant = getVariant(testName);
    console.log(`[A/B Test] ${testName} - Variant ${variant} - Event: ${eventName}`, data);
    // In a real app, send this to an analytics service
  }
  ```

## Success Criteria

The implementation will be considered successful when:

1. **Context Menu**:
   - Navigation items no longer trigger unexpected behavior
   - Code changes take effect without requiring page refresh
   - Future implementation path is clearly documented

2. **Performance**:
   - Page transitions complete in under 300ms
   - Users receive immediate visual feedback when clicking navigation items
   - No duplicate clicks occur due to perceived non-responsiveness
   - Lighthouse performance score improves by at least 20 points

## Timeline

- **Phase 1 (Context Menu Cleanup)**: 1 day
- **Phase 2 (Immediate Performance Improvements)**: 2-3 days
- **Phase 3 (Data Fetching Optimization)**: 2-3 days
- **Phase 4 (Code Splitting and Bundle Optimization)**: 2-3 days
- **Phase 5 (Server Components and Streaming)**: 3-4 days
- **Phase 6 (Prefetching and Caching)**: 2 days
- **Phase 7 (Testing and Measurement)**: Ongoing

## Monitoring and Iteration

After implementing these changes, we will:

1. Monitor real user metrics to ensure performance improvements are realized
2. Gather user feedback on the perceived performance
3. Iterate on the implementation based on metrics and feedback
4. Document best practices for future development to maintain performance

## References

- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Server Components](https://nextjs.org/docs/getting-started/react-essentials#server-components)
- [SWR Documentation](https://swr.vercel.app/)
- [Web Vitals](https://web.dev/vitals/)
