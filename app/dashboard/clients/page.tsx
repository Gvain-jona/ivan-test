'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientsListScreen from '@/components/clients/list/ClientsListScreen';
import { useSheets } from '@/context/sheet-host';

/**
 * Clients — C1. A thin shell like the orders page: the list owns its own data
 * and filters, and creating a client goes through the sheet host so the intent
 * stays in one place.
 */
function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCreateClient } = useSheets();

  // ?new=1 (Home's quick-action chip, deep links) opens the create sheet, then
  // strips the param so a refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      openCreateClient();
      router.replace('/dashboard/clients');
    }
  }, [searchParams, openCreateClient, router]);

  return <ClientsListScreen />;
}

export default function ClientsPage() {
  // useSearchParams needs a Suspense boundary to keep the route from opting the
  // whole page out of static optimization.
  return (
    <Suspense fallback={null}>
      <ClientsPageContent />
    </Suspense>
  );
}
