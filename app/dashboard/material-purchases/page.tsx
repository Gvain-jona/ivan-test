'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, ListFilter, FileText, CheckSquare, Package, ShoppingBag, ArrowUpCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Import our custom components
import { MaterialPurchaseForm } from '@/components/materials/forms/MaterialPurchaseForm';
import { MaterialPurchasesTabContent } from './_components/table/MaterialPurchasesTabContent';
import { TasksTabContent } from './_components/tasks';

// Import our data hooks and context
import {
  useMaterialPurchases,
  MaterialPurchase
} from '@/hooks/materials';
import { MaterialPurchasesProvider } from './_context/MaterialPurchasesContext';

export default function MaterialPurchasesPage() {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'tasks'

  // Handle tab change to sync filters
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  }
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const { toast } = useToast();

  // Fetch material purchases for metrics with improved error handling
  const {
    purchases,
    isLoading,
    isError,
    mutate
  } = useMaterialPurchases(1, 100); // Fetch a larger set for metrics

  // Debug log to see the purchases data and handle errors
  useEffect(() => {
    console.log('MaterialPurchasesPage - purchases:', purchases);

    if (isError) {
      console.error('Error loading material purchases data:', isError);
    }
  }, [purchases, isError]);

  // Ensure purchases is an array to prevent errors
  const safePurchases = Array.isArray(purchases) ? purchases : [];

  // Calculate metrics with safe array and null checks
  const totalSpent = safePurchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
  const totalItems = safePurchases.reduce((sum, purchase) => sum + (purchase.quantity || 0), 0);
  const uniqueSuppliers = new Set(safePurchases.map(p => p?.supplier_name).filter(Boolean)).size;
  const pendingPurchases = safePurchases.filter(p => p?.payment_status !== 'paid').length;

  // Handle refresh data
  const refreshData = () => {
    mutate();
  };

  return (
    <MaterialPurchasesProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Material Purchases</h1>
            <p className="text-muted-foreground mt-1">Manage your material inventory and purchases</p>
          </div>

          {/* Add Purchase button is now in the MaterialPurchasesTabContent */}
        </div>

        {/* Search and Filters are now handled by MaterialPurchasesTabContent */}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-orange-500 mt-1 flex items-center">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>All time</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalItems)}</div>
              <p className="text-xs text-blue-500 mt-1 flex items-center">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>Items purchased</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Suppliers</CardTitle>
              <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueSuppliers}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>Active suppliers</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPurchases}</div>
              <p className="text-xs text-yellow-500 mt-1 flex items-center">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span>Pending purchases</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="bg-transparent border border-border/40 rounded-lg p-1">
            <TabsTrigger
              value="purchases"
              className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
            >
              <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
              Purchases
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="text-sm font-medium text-muted-foreground py-2 px-4 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
            >
              <CheckSquare className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-4">
            <MaterialPurchasesTabContent
              onRegisterHandleAddPurchase={(handler) => {
                // Register the handler for adding purchases
                console.log('Handler registered from parent component');
              }}
            />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TasksTabContent />
          </TabsContent>
        </Tabs>

        {/* All sheets and modals are now handled by MaterialPurchasesTabContent */}
      </div>
    </MaterialPurchasesProvider>
  );
}

