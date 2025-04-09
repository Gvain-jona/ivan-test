'use client';

import React, { useState } from 'react';
import { PlusCircle, ListFilter, FileText, CheckSquare, Package, ShoppingBag, ArrowUpCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Define types for our data
interface MaterialPurchase {
  id: string;
  supplier: string;
  material: string;
  date: string;
  quantity: number;
  totalCost: number;
  paymentStatus: string;
  paymentType: string;
}

// Sample material purchase data for development
const SAMPLE_PURCHASES: MaterialPurchase[] = [
  {
    id: 'MAT-001',
    supplier: 'Paper Supplies Ltd',
    material: 'Premium Cardstock',
    date: '2024-03-10',
    quantity: 500,
    totalCost: 750.00,
    paymentStatus: 'Paid',
    paymentType: 'Credit Card'
  },
  {
    id: 'MAT-002',
    supplier: 'Ink Solutions',
    material: 'Eco-Friendly Ink',
    date: '2024-03-15',
    quantity: 10,
    totalCost: 450.00,
    paymentStatus: 'Pending',
    paymentType: 'Bank Transfer'
  },
  {
    id: 'MAT-003',
    supplier: 'PrinterParts Co',
    material: 'Printer Maintenance Kit',
    date: '2024-03-22',
    quantity: 2,
    totalCost: 320.00,
    paymentStatus: 'Paid',
    paymentType: 'Cash'
  },
];

export default function MaterialPurchasesPage() {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'tasks'

  // Calculate metrics
  const totalCost = SAMPLE_PURCHASES.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalQuantity = SAMPLE_PURCHASES.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const uniqueSuppliers = new Set(SAMPLE_PURCHASES.map(p => p.supplier)).size;
  const pendingPurchases = SAMPLE_PURCHASES.filter(p => p.paymentStatus === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Purchases</h1>
          <p className="text-muted-foreground mt-1">Manage your material inventory and purchases</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <ListFilter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" className="h-9">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Purchase
          </Button>
        </div>
      </div>

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
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-orange-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>This month</span>
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
            <div className="text-2xl font-bold">{formatNumber(totalQuantity)}</div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
          <PurchasesTabContent purchases={SAMPLE_PURCHASES} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TasksTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Purchases tab content with purchase listing
function PurchasesTabContent({ purchases }: { purchases: MaterialPurchase[] }) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/5">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell className="font-medium">{purchase.id}</TableCell>
              <TableCell>{purchase.supplier}</TableCell>
              <TableCell>{purchase.material}</TableCell>
              <TableCell>{purchase.date}</TableCell>
              <TableCell>{formatNumber(purchase.quantity)}</TableCell>
              <TableCell>{formatCurrency(purchase.totalCost)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={purchase.paymentStatus === 'Paid'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }>
                  {purchase.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Tasks tab content (placeholder for now)
function TasksTabContent() {
  return (
    <Card className="bg-transparent border-border/40">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Purchase-related tasks</h3>
          <p className="text-muted-foreground max-w-md">This feature is currently under development. You'll be able to manage tasks related to your material purchases here.</p>
          <Button variant="outline" className="mt-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}