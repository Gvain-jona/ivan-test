'use client';

import React, { useState, useEffect } from 'react';
import { Construction, Package, ArrowRight, Wrench, Blocks, CheckSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Function to calculate time until next Sunday 12am
function getTimeUntilNextSunday() {
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
  
  return nextSunday;
}

// Countdown component
function CountdownTimer() {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Calculate the end time (next Sunday 12am + 48 hours)
    const nextSunday = getTimeUntilNextSunday();
    const endTime = new Date(nextSunday.getTime() + 48 * 60 * 60 * 1000);
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const timeDiff = endTime.getTime() - now.getTime();
      
      // If countdown is finished
      if (timeDiff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });
      setIsLoading(false);
    };
    
    // Initial calculation
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return <div className="flex items-center gap-1 text-sm text-muted-foreground">Loading...</div>;
  }
  
  return (
    <div className="mt-3 flex items-center gap-2">
      <Clock className="h-4 w-4 text-orange-500" />
      <div className="text-sm font-medium">
        <span className="text-orange-500">High server traffic!</span> Upload will finish in:
        <span className="ml-1 font-bold">
          {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
        </span>
      </div>
    </div>
  );
}

export default function FeatureInDevelopmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature In Development</h1>
          <p className="text-muted-foreground mt-1">These features are coming soon to enhance your business management experience</p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-2 sm:mt-0">
          <Link href="/dashboard/orders">
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* Construction Banner */}
      <Card className="bg-orange-500/10 border-orange-500/30 text-foreground rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Construction className="h-12 w-12 text-orange-500" />
            <div className="text-center md:text-left">
              <h2 className="text-xl font-semibold mb-2">Under Construction</h2>
              <p className="text-muted-foreground max-w-3xl">
                We're working hard to bring you exciting new features. These sections are still under development and will be available soon. In the meantime, you can use the Orders feature which is fully functional.
              </p>
              <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <p className="text-sm text-blue-400">
                    Due to high server traffic, feature deployments are scheduled to complete within 48 hours from Sunday 12am.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <FeatureCard
          title="Enhanced Expense Tracking"
          description="Track and categorize expenses with detailed reporting and analytics. Monitor your business costs effectively."
          icon={<Blocks className="h-8 w-8 text-orange-500" />}
          comingSoon={true}
        />

        <FeatureCard
          title="Smart Task Management"
          description="Organize your work with intelligent task prioritization and reminders. Never miss important deadlines again."
          icon={<CheckSquare className="h-8 w-8 text-orange-500" />}
          comingSoon={true}
        />

        <FeatureCard
          title="Material Purchases"
          description="Manage your material purchases with tracking, alerts, and automated reordering. Optimize your inventory management."
          icon={<Wrench className="h-8 w-8 text-orange-500" />}
          comingSoon={true}
        />

        <FeatureCard
          title="Order Management"
          description="Track and manage customer orders from creation to delivery. Our most complete feature with full functionality."
          icon={<Package className="h-8 w-8 text-orange-500" />}
          available={true}
          href="/dashboard/orders"
        />
      </div>

      {/* CTA Section */}
      <div className="my-8 flex justify-center">
        <Button asChild size="lg" className="rounded-full bg-orange-500 hover:bg-orange-600">
          <Link href="/dashboard/orders">
            <Package className="mr-2 h-5 w-5" />
            Go to Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  title,
  description,
  icon,
  comingSoon = false,
  available = false,
  href = "#",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  available?: boolean;
  href?: string;
}) {
  return (
    <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl h-full flex flex-col shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-muted/20 rounded-lg">
            {icon}
          </div>
          {comingSoon && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
              Coming Soon
            </span>
          )}
          {available && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
              Available Now
            </span>
          )}
        </div>
        <CardTitle className="text-lg font-medium mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-6 flex-1">
        <p className="text-muted-foreground">{description}</p>
        
        {comingSoon && <CountdownTimer />}

        {available && (
          <div className="mt-4">
            <Button asChild variant="outline" size="sm" className="hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30">
              <Link href={href}>
                <span>Go to Feature</span>
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
