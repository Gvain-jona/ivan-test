'use client';

import dynamic from 'next/dynamic';
import { OrdersSkeleton } from '@/components/skeletons';

// Dynamically import the OrdersTable component
const DynamicOrdersTable = dynamic(
  () => import('./OrdersTable').then(mod => ({ default: mod.OrdersTable })),
  {
    loading: () => <OrdersSkeleton />,
    ssr: false // Disable server-side rendering for this component
  }
);

// Dynamically import the OrdersFilters component
const DynamicOrdersFilters = dynamic(
  () => import('./OrdersFilters').then(mod => ({ default: mod.OrdersFilters })),
  {
    loading: () => <div className="h-10 bg-gray-800/20 animate-pulse rounded-lg" />,
    ssr: false
  }
);

// Dynamically import the OrdersHeader component
const DynamicOrdersHeader = dynamic(
  () => import('./OrdersHeader').then(mod => ({ default: mod.OrdersHeader })),
  {
    loading: () => <div className="h-16 bg-gray-800/20 animate-pulse rounded-lg" />,
    ssr: false
  }
);

interface DynamicOrdersPageProps {
  initialData?: any;
}

export function DynamicOrdersPage({ initialData }: DynamicOrdersPageProps) {
  return (
    <div className="space-y-6">
      <DynamicOrdersHeader />
      <DynamicOrdersFilters />
      <DynamicOrdersTable initialData={initialData} />
    </div>
  );
}
