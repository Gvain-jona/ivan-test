'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard index — platform-adaptive landing per the design philosophy
 * (docs/mobile-responsiveness/DESIGN_PHILOSOPHY.md): mobile lands on the
 * Home feed, desktop lands on Orders. Home is a mobile-only surface, so
 * desktop never enters it. `lg` = 1024px, matching the shell's breakpoint.
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Short delay so navigation state settles before the push.
    const timer = setTimeout(() => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      router.push(isDesktop ? '/dashboard/orders' : '/dashboard/home');
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