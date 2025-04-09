'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard index page that redirects to the orders page
 * Home page is temporarily removed from navigation
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the orders page after a short delay
    // This ensures the navigation state is properly updated
    const timer = setTimeout(() => {
      router.push('/dashboard/orders');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
      <h1 className="text-2xl font-bold">Loading Orders...</h1>
      <p className="text-gray-400 mt-2">Please wait while we prepare your orders dashboard</p>
    </div>
  );
}