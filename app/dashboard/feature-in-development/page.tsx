'use client';

import React, { useState, useEffect } from 'react';
import { Construction, Package, ArrowRight, Wrench, Blocks, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Progress } from '@/app/components/ui/progress';

export default function FeatureInDevelopmentPage() {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 32,
    minutes: 0,
    seconds: 0
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate the target time (32 hours from Sunday 12pm)
    const calculateTargetTime = () => {
      const now = new Date();
      const totalSeconds = 32 * 60 * 60; // 32 hours in seconds

      // Calculate remaining time in seconds
      const elapsedSeconds = (now.getHours() * 60 * 60) + (now.getMinutes() * 60) + now.getSeconds();
      const remainingSeconds = totalSeconds - elapsedSeconds;

      // Calculate hours, minutes, seconds
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      // Calculate progress percentage
      const progressPercentage = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

      return {
        hours: hours > 0 ? hours : 0,
        minutes: minutes > 0 ? minutes : 0,
        seconds: seconds > 0 ? seconds : 0,
        progress: progressPercentage > 0 && progressPercentage <= 100 ? progressPercentage : 0
      };
    };

    // Initial calculation
    const initialTime = calculateTargetTime();
    setTimeRemaining({
      hours: initialTime.hours,
      minutes: initialTime.minutes,
      seconds: initialTime.seconds
    });
    setProgress(initialTime.progress);

    // Update countdown every second
    const timer = setInterval(() => {
      const time = calculateTargetTime();
      setTimeRemaining({
        hours: time.hours,
        minutes: time.minutes,
        seconds: time.seconds
      });
      setProgress(time.progress);

      // If countdown is complete, clear interval
      if (time.hours <= 0 && time.minutes <= 0 && time.seconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature In Development</h1>
          <p className="text-muted-foreground mt-1">This feature is coming soon to enhance your experience</p>
        </div>
      </div>

      {/* Construction Banner */}
      <Card className="bg-orange-500/10 border-orange-500/30 text-foreground rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Construction className="h-12 w-12 text-orange-500" />
            <div className="text-center md:text-left">
              <h2 className="text-xl font-semibold mb-2">Under Construction</h2>
              <p className="text-muted-foreground max-w-3xl">
                We're working hard to bring you exciting new features. This section is still under development and will be available soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Status Banner */}
      <Card className="bg-blue-500/10 border-blue-500/30 text-foreground rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Upload className="h-8 w-8 text-blue-500" />
              <h2 className="text-xl font-semibold">Uploading to Server</h2>
            </div>

            <div className="w-full max-w-md">
              <p className="text-center text-muted-foreground mb-2">
                High server traffic. Upload finishes in:
              </p>

              <div className="flex justify-center items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-mono font-bold">
                  {String(timeRemaining.hours).padStart(2, '0')}:
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </span>
              </div>

              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <FeatureCard
          title="Enhanced Expense Tracking"
          description="Track and categorize expenses with detailed reporting and analytics."
          icon={<Blocks className="h-8 w-8 text-orange-500" />}
          comingSoon={true}
        />

        <FeatureCard
          title="Smart Task Management"
          description="Organize your work with intelligent task prioritization and reminders."
          icon={<CheckSquare className="h-8 w-8 text-orange-500" />}
          comingSoon={true}
        />

        <FeatureCard
          title="Material Purchases"
          description="Manage your material purchases with tracking, alerts, and automated reordering."
          icon={<Wrench className="h-8 w-8 text-orange-500" />}
          comingSoon={true}
        />

        <FeatureCard
          title="Order Management"
          description="Track and manage customer orders from creation to delivery."
          icon={<Package className="h-8 w-8 text-orange-500" />}
          available={true}
          href="/dashboard/orders"
        />
      </div>

      {/* CTA Section */}
      <div className="my-8 flex justify-center">
        <Button asChild size="lg" className="rounded-full">
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
  href = "#"
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  available?: boolean;
  href?: string;
}) {
  return (
    <Card className="bg-transparent border-[hsl(var(--border))]/40 hover:bg-muted/10 transition-all duration-200 rounded-xl h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {icon}
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
        {available && (
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
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

function CheckSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}