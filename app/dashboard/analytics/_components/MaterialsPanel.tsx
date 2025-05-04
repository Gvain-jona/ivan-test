'use client';

import React from 'react';
import { KPICard } from '@/components/analytics/KPICard';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { useAnalyticsContext } from '../_context/AnalyticsContext';
import { useMaterialsBySupplier, useInstallmentDelinquencyRate } from '@/hooks/analytics/useAnalytics';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/chart-config';
import {
  PackageIcon,
  TruckIcon,
  AlertTriangleIcon,
  PercentIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function MaterialsPanel() {
  const { dateRange, setIsLoading } = useAnalyticsContext();

  // Fetch materials by supplier
  const {
    suppliers: materialsBySupplier,
    isLoading: isLoadingMaterials
  } = useMaterialsBySupplier(dateRange);

  // Fetch installment delinquency rate
  const {
    delinquency: installmentDelinquency,
    isLoading: isLoadingDelinquency
  } = useInstallmentDelinquencyRate();

  // Update loading state
  React.useEffect(() => {
    setIsLoading(isLoadingMaterials || isLoadingDelinquency);
  }, [isLoadingMaterials, isLoadingDelinquency, setIsLoading]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!materialsBySupplier || materialsBySupplier.length === 0) {
      return {
        totalPurchases: 0,
        totalAmount: 0,
        amountPaid: 0,
        balance: 0,
        paymentPercentage: 0
      };
    }

    const totalPurchases = materialsBySupplier.reduce((sum, item) => sum + item.total_purchases, 0);
    const totalAmount = materialsBySupplier.reduce((sum, item) => sum + item.total_amount, 0);
    const amountPaid = materialsBySupplier.reduce((sum, item) => sum + item.amount_paid, 0);
    const balance = totalAmount - amountPaid;
    const paymentPercentage = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

    return {
      totalPurchases,
      totalAmount,
      amountPaid,
      balance,
      paymentPercentage
    };
  }, [materialsBySupplier]);

  // Prepare supplier chart data
  const supplierChartData = React.useMemo(() => {
    if (!materialsBySupplier) return { labels: [], datasets: [] };

    // Sort suppliers by total amount
    const sortedSuppliers = [...materialsBySupplier].sort((a, b) => b.total_amount - a.total_amount).slice(0, 10);

    return {
      labels: sortedSuppliers.map(supplier => supplier.supplier_name),
      datasets: [
        {
          label: 'Total Amount',
          data: sortedSuppliers.map(supplier => supplier.total_amount),
          backgroundColor: '#3b82f6',
        },
        {
          label: 'Amount Paid',
          data: sortedSuppliers.map(supplier => supplier.amount_paid),
          backgroundColor: '#22c55e',
        },
        {
          label: 'Balance',
          data: sortedSuppliers.map(supplier => supplier.total_amount - supplier.amount_paid),
          backgroundColor: '#ef4444',
        },
      ],
    };
  }, [materialsBySupplier]);

  // Prepare payment status chart data
  const paymentStatusData = React.useMemo(() => {
    if (!materialsBySupplier || materialsBySupplier.length === 0) return { labels: [], datasets: [] };

    const totalAmount = materialsBySupplier.reduce((sum, item) => sum + item.total_amount, 0);
    const amountPaid = materialsBySupplier.reduce((sum, item) => sum + item.amount_paid, 0);
    const balance = totalAmount - amountPaid;

    return {
      labels: ['Paid', 'Unpaid'],
      datasets: [
        {
          data: [amountPaid, balance],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 1,
          borderColor: 'rgb(var(--background))',
        },
      ],
    };
  }, [materialsBySupplier]);

  // Prepare installment status chart data
  const installmentStatusData = React.useMemo(() => {
    if (!installmentDelinquency) return { labels: [], datasets: [] };

    const { overdue_count, total_count } = installmentDelinquency;
    const onTimeCount = total_count - overdue_count;

    return {
      labels: ['On Time', 'Overdue'],
      datasets: [
        {
          data: [onTimeCount, overdue_count],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 1,
          borderColor: 'rgb(var(--background))',
        },
      ],
    };
  }, [installmentDelinquency]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Material Purchases"
          value={formatCurrency(summaryMetrics.totalAmount)}
          icon={<PackageIcon className="h-5 w-5 text-blue-500" />}
          isLoading={isLoadingMaterials}
          iconClassName="bg-blue-100 dark:bg-blue-900/20"
        />

        <KPICard
          title="Amount Paid"
          value={formatCurrency(summaryMetrics.amountPaid)}
          icon={<TruckIcon className="h-5 w-5 text-green-500" />}
          isLoading={isLoadingMaterials}
          iconClassName="bg-green-100 dark:bg-green-900/20"
        />

        <KPICard
          title="Outstanding Balance"
          value={formatCurrency(summaryMetrics.balance)}
          icon={<AlertTriangleIcon className="h-5 w-5 text-red-500" />}
          isLoading={isLoadingMaterials}
          iconClassName="bg-red-100 dark:bg-red-900/20"
        />

        <KPICard
          title="Payment Percentage"
          value={formatPercentage(summaryMetrics.paymentPercentage)}
          icon={<PercentIcon className="h-5 w-5 text-purple-500" />}
          isLoading={isLoadingMaterials}
          iconClassName="bg-purple-100 dark:bg-purple-900/20"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartComponent
          title="Top Suppliers by Purchase Amount"
          description="Showing top 10 suppliers"
          data={supplierChartData}
          isLoading={isLoadingMaterials}
          className="lg:col-span-2"
          height={300}
          options={{
            scales: {
              y: {
                ticks: {
                  callback: (value) => formatCurrency(Number(value)),
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${context.dataset.label}: ${formatCurrency(value)}`;
                  },
                },
              },
            },
          }}
        />

        <div className="grid grid-cols-1 gap-6">
          <PieChartComponent
            title="Payment Status"
            description="Paid vs. unpaid amounts"
            data={paymentStatusData}
            isLoading={isLoadingMaterials}
            height={140}
            type="doughnut"
            options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number;
                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />

          <PieChartComponent
            title="Installment Status"
            description="On time vs. overdue installments"
            data={installmentStatusData}
            isLoading={isLoadingDelinquency}
            height={140}
            type="doughnut"
            options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number;
                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${context.label}: ${value} installments (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Installment Delinquency Card */}
      <Card>
        <CardHeader>
          <CardTitle>Installment Delinquency</CardTitle>
          <CardDescription>Current status of installment payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingDelinquency ? (
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-6 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            ) : installmentDelinquency ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delinquency Rate</span>
                  <span className="font-medium">{formatPercentage(installmentDelinquency.delinquency_rate * 100)}</span>
                </div>
                <Progress
                  value={installmentDelinquency.delinquency_rate * 100}
                  className="h-2"
                  indicatorClassName={
                    installmentDelinquency.delinquency_rate > 0.3
                      ? "bg-red-500"
                      : installmentDelinquency.delinquency_rate > 0.1
                        ? "bg-orange-500"
                        : "bg-green-500"
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Overdue Installments</span>
                    <p className="text-xl font-bold">{formatNumber(installmentDelinquency.overdue_count)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Total Installments</span>
                    <p className="text-xl font-bold">{formatNumber(installmentDelinquency.total_count)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Overdue Amount</span>
                    <p className="text-xl font-bold">{formatCurrency(installmentDelinquency.total_overdue_amount)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No installment data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers by Purchase Amount</CardTitle>
          <CardDescription>Detailed breakdown of material purchases by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Payment %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMaterials ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : materialsBySupplier && materialsBySupplier.length > 0 ? (
                materialsBySupplier.map((supplier, index) => {
                  const balance = supplier.total_amount - supplier.amount_paid;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                      <TableCell className="text-right">{formatNumber(supplier.total_purchases)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(supplier.total_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(supplier.amount_paid)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(balance)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={supplier.payment_percentage >= 90 ? "success" : supplier.payment_percentage >= 50 ? "warning" : "destructive"}
                          className="ml-auto"
                        >
                          {formatPercentage(supplier.payment_percentage)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No supplier data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
