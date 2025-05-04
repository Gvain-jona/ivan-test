'use client';

import React from 'react';
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Package, Users, CheckSquare, DollarSign } from "lucide-react";
import { UpcomingExpenses } from './_components/UpcomingExpenses';

/**
 * A simplified home page that loads quickly without complex data fetching
 */
export default function SimpleHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to your business management dashboard.</p>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-orange-500 mt-1">12 pending</p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX 8,750,000</div>
            <p className="text-xs text-orange-500 mt-1">8% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-orange-500 mt-1">4% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50</div>
            <p className="text-xs text-orange-500 mt-1">8 pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Orders</h2>
          <Card className="bg-transparent border-border/40">
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading recent orders...</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <UpcomingExpenses />
        </div>
      </div>

      <div className="text-center text-muted-foreground mt-8">
        <p>Loading full dashboard content...</p>
      </div>
    </div>
  );
}
