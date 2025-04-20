'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PaymentProgressBarProps {
  percentage: number;
  className?: string;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  colorScheme?: 'default' | 'gradient';
}

/**
 * A reusable payment progress bar component that shows payment completion percentage
 * with different colors based on the percentage value
 */
export const PaymentProgressBar: React.FC<PaymentProgressBarProps> = ({
  percentage,
  className,
  showLabel = true,
  height = 'md',
  colorScheme = 'default'
}) => {
  // Ensure percentage is between 0 and 100
  const safePercentage = Math.min(100, Math.max(0, percentage));
  
  // Get color based on percentage
  const getProgressColor = () => {
    if (colorScheme === 'gradient') {
      return 'bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500';
    }
    
    if (safePercentage >= 75) {
      return 'bg-green-500';
    } else if (safePercentage >= 50) {
      return 'bg-blue-500';
    } else if (safePercentage >= 25) {
      return 'bg-yellow-500';
    } else {
      return 'bg-orange-500';
    }
  };
  
  // Get height class
  const getHeightClass = () => {
    switch (height) {
      case 'sm': return 'h-1';
      case 'lg': return 'h-3';
      case 'md':
      default: return 'h-2';
    }
  };
  
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Payment Progress</span>
          <span className="text-xs font-medium">{safePercentage}%</span>
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', getHeightClass())}>
        <div 
          className={cn('h-full transition-all duration-300', getProgressColor())}
          style={{ width: `${safePercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PaymentProgressBar;
