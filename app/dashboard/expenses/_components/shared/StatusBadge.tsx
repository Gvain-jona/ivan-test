import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type: 'payment' | 'note' | 'recurring';
  className?: string;
}

/**
 * A reusable badge component for displaying status
 */
export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  // Get badge color based on status and type
  const getBadgeColor = () => {
    if (type === 'payment') {
      switch (status) {
        case 'paid':
          return 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20';
        case 'partially_paid':
          return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20';
        case 'unpaid':
          return 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20';
        default:
          return 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20';
      }
    } else if (type === 'note') {
      switch (status) {
        case 'info':
          return 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20';
        case 'follow-up':
          return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20';
        case 'urgent':
          return 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20';
        case 'internal':
          return 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20';
        default:
          return 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20';
      }
    } else if (type === 'recurring') {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20';
    }

    return 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20';
  };

  // Format the status text
  const formatStatus = (status: string) => {
    // Handle payment status specially to show percentage for partially_paid
    if (type === 'payment' && status === 'partially_paid') {
      return 'Partially Paid';
    }

    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get badge icon based on status and type
  const getBadgeIcon = () => {
    // You could add icons here in the future if needed
    return null;
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        getBadgeColor(),
        'capitalize font-medium px-2.5 py-0.5 rounded-md text-xs',
        className
      )}
    >
      {getBadgeIcon()}
      {formatStatus(status)}
    </Badge>
  );
}
