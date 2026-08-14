'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductsListScreen from '@/components/products/list/ProductsListScreen';
import { useSheets } from '@/context/sheet-host';

/**
 * Products — D1. A thin shell like the orders and clients pages: the list owns
 * its own data and filters, and creating a product goes through the sheet host
 * so the intent stays in one place.
 */
function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCreateProduct } = useSheets();

  // ?new=1 (Home's quick-action chip, deep links) opens the create sheet, then
  // strips the param so a refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      openCreateProduct();
      router.replace('/dashboard/products');
    }
  }, [searchParams, openCreateProduct, router]);

  return <ProductsListScreen />;
}

export default function ProductsPage() {
  // useSearchParams needs a Suspense boundary to keep the route from opting the
  // whole page out of static optimization.
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}
