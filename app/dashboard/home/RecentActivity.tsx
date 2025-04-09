'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, CheckSquare } from 'lucide-react';

interface Activity {
  type: 'order' | 'task';
  id: string;
  title: string;
  date: string;
  data: any;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={`${activity.type}-${activity.id}`} className="flex items-start">
              <div className="mr-4 mt-0.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
                  {activity.type === 'order' ? (
                    <Package className="h-4 w-4" />
                  ) : (
                    <CheckSquare className="h-4 w-4" />
                  )}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.title}
                  {activity.type === 'order' && (
                    <Badge className="ml-2" variant="outline">
                      {activity.data.status}
                    </Badge>
                  )}
                  {activity.type === 'task' && (
                    <Badge className="ml-2" variant="outline">
                      {activity.data.priority}
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.type === 'order' && `Customer: ${activity.data.customer}`}
                  {activity.type === 'task' && activity.data.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.date).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
