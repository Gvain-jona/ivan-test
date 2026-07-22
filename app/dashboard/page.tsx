'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard index — redirects to the Home feed (the mobile-first landing
 * that replaced the old orders redirect during the UI transformation).
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Short delay so navigation state settles before the push.
    const timer = setTimeout(() => {
      router.push('/dashboard/home');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
      <h1 className="text-2xl font-bold">Loading&hellip;</h1>
      <p className="text-gray-400 mt-2">Preparing your dashboard</p>
    </div>
  );
}