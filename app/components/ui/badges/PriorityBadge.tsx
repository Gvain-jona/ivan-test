import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ArrowDown, 
  Minus, 
  ArrowUp, 
  AlertTriangle
} from 'lucide-react';
import { TaskPriority } from '@/types/tasks';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

/**
 * A reusable priority badge component for displaying task priorities
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  className,
  showIcon = true
}) => {
  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return {
          icon: <ArrowDown className="h-3 w-3 mr-1" />,
          label: 'Low',
          className: 'bg-blue-900/20 text-blue-400 border-blue-800',
        };
      case 'medium':
        return {
          icon: <Minus className="h-3 w-3 mr-1" />,
          label: 'Medium',
          className: 'bg-yellow-900/20 text-yellow-400 border-yellow-800',
        };
      case 'high':
        return {
          icon: <ArrowUp className="h-3 w-3 mr-1" />,
          label: 'High',
          className: 'bg-orange-900/20 text-orange-400 border-orange-800',
        };
      case 'urgent':
        return {
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: 'Urgent',
          className: 'bg-red-900/20 text-red-400 border-red-800',
        };
      default:
        // This should never happen with the defined TaskPriority type,
        // but we provide a fallback for type safety
        return {
          icon: <Minus className="h-3 w-3 mr-1" />,
          label: 'Unknown',
          className: 'bg-gray-900/20 text-gray-400 border-gray-800',
        };
    }
  };

  const { icon, label, className: priorityClassName } = getPriorityConfig(priority);

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'px-2 py-1 text-xs font-medium rounded border', 
        priorityClassName, 
        className
      )}
    >
      {showIcon && icon}
      <span>{label}</span>
    </Badge>
  );
};

export default PriorityBadge; 