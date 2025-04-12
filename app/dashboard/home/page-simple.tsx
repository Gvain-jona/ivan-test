'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Package, Users, CheckSquare, DollarSign, Clock, Info, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Function to calculate time until next Sunday 12am + 48 hours
function getTimeUntilFeatureActivation() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate days until next Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  // Create date object for next Sunday at 12am
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(0, 0, 0, 0);
  
  // If today is Sunday and it's past 12am, use next Sunday
  if (dayOfWeek === 0 && now.getHours() >= 0) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  
  // Add 48 hours to next Sunday 12am
  const activationTime = new Date(nextSunday.getTime() + 48 * 60 * 60 * 1000);
  
  // Calculate time difference
  const timeDiff = activationTime.getTime() - now.getTime();
  
  // If countdown is finished
  if (timeDiff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * A simplified home page that loads quickly without complex data fetching
 */
export default function SimpleHomePage() {
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilFeatureActivation());
  
  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilFeatureActivation());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to your business management dashboard.</p>
      
      {/* Feature Activation Alert */}
      <Alert className="bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-medium">Feature Activation Notice</AlertTitle>
        <AlertDescription className="mt-2">
          <p>Some features will be inactive until full product upload to the server is complete.</p>
          <div className="mt-2 flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>
              Upload will finish in: <span className="text-blue-600 dark:text-blue-300 font-bold">
                {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
              </span>
            </span>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10" asChild>
              <Link href="/dashboard/feature-in-development">
                View Feature Status
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      
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
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Tasks</h2>
          <Card className="bg-transparent border-border/40">
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading upcoming tasks...</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="text-center text-muted-foreground mt-8">
        <p>Loading full dashboard content...</p>
      </div>
    </div>
  );
}
