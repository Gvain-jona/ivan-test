'use client';

import { BarChart2, ArrowUpRight, TrendingUp, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { StatCard, GradientCard, Card, CardContent } from '../ui/card';

interface StatCardsProps {
  stats?: {
    totalProfit?: number;
    totalOrders?: number;
    totalCustomers?: number;
    totalExpenses?: number;
  };
  isLoading?: boolean;
}

export default function StatCards({ 
  stats = {
    totalProfit: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalExpenses: 0
  }, 
  isLoading = false 
}: StatCardsProps) {
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-[140px] animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-24 bg-gray-800 rounded mb-4"></div>
              <div className="h-8 w-32 bg-gray-800 rounded"></div>
              <div className="flex items-center mt-4">
                <div className="h-4 w-16 bg-gray-800 rounded mr-2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Profit"
        value={formatCurrency(stats.totalProfit || 0)}
        icon={<DollarSign />}
        trend={{
          value: 7.2,
          label: "vs last week",
          isPositive: true
        }}
      />
      
      <StatCard
        title="Orders"
        value={stats.totalOrders?.toLocaleString() || "0"}
        icon={<Package />}
        trend={{
          value: 12.5,
          label: "vs last month",
          isPositive: true
        }}
      />
      
      <StatCard
        title="Customers"
        value={stats.totalCustomers?.toLocaleString() || "0"}
        icon={<Users />}
        trend={{
          value: 3.2,
          label: "vs last month",
          isPositive: true
        }}
      />
      
      <StatCard
        title="Expenses"
        value={formatCurrency(stats.totalExpenses || 0)}
        icon={<ShoppingCart />}
        trend={{
          value: 2.1,
          label: "vs last month",
          isPositive: false
        }}
      />
    </div>
  );
} 