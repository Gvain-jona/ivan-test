'use client';

import { useAnalyticsContext } from './_context/AnalyticsContext';
import { AnalyticsHeader } from './_components/AnalyticsHeader';
import { OverviewPanel } from './_components/OverviewPanel';
import { OrdersPanel } from './_components/OrdersPanel';
import { ExpensesPanel } from './_components/ExpensesPanel';
import { MaterialsPanel } from './_components/MaterialsPanel';
import { FinancialsPanel } from './_components/FinancialsPanel';

export default function AnalyticsPage() {
  const { activeTab } = useAnalyticsContext();

  return (
    <div className="space-y-6">
      <AnalyticsHeader />

      {activeTab === 'overview' && <OverviewPanel />}
      {activeTab === 'orders' && <OrdersPanel />}
      {activeTab === 'expenses' && <ExpensesPanel />}
      {activeTab === 'materials' && <MaterialsPanel />}
      {activeTab === 'financials' && <FinancialsPanel />}
    </div>
  );
}