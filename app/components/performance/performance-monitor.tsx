'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PerformanceMonitor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Performance monitoring temporarily disabled to improve performance
  useEffect(() => {
    // Disabled
    return;
  }, [pathname, searchParams]);

  return null;
}
