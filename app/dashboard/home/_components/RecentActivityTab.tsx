'use client';

import React from 'react';
import { 
  Package, 
  DollarSign, 
  CheckSquare,
  UserPlus,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useHomePage } from '../_context/HomePageContext';

/**
 * Tab content for the Recent Activity tab in the Home page
 */
const RecentActivityTab: React.FC = () => {
  const { 
    recentActivity, 
    initialLoading 
  } = useHomePage();

  // Function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Function to get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_status_changed':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'task_completed':
        return <CheckSquare className="h-5 w-5 text-blue-500" />;
      case 'client_added':
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 p-4 space-y-4">
        {initialLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex items-start gap-4 pb-4 border-b border-border/40 last:border-0 last:pb-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          // Actual data
          recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border/40 last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{activity.description}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-muted-foreground">By {activity.user}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => window.location.href = '/dashboard/activity'}
        >
          <span>View All Activity</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RecentActivityTab;
