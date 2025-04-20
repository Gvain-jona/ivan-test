'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Info,
  ExternalLink,
  DollarSign,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MetricItem {
  label: string;
  value: string;
  change: string;
  status: string;
}

interface ClientDebt {
  id: string;
  name: string;
  debt: number;
  orderCount: number;
}

interface PendingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'delivered' | 'not_delivered' | 'partially_paid';
}

interface PendingInvoicesCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  total: string | number;
  change: string;
  subtitle: string;
  categories: string[];
  activeCategory: string;
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'custom';
  metrics: MetricItem[];
  clientsWithDebt?: ClientDebt[];
  pendingInvoices?: PendingInvoice[];
  onCategoryChange?: (category: string) => void;
  onTimeRangeChange?: (range: string) => void;
  onViewMore?: () => void;
}

/**
 * PendingInvoicesCard component for displaying pending invoices in a card format
 * without charts and tabs
 */
const PendingInvoicesCard: React.FC<PendingInvoicesCardProps> = ({
  title,
  icon,
  accentColor,
  total,
  change,
  subtitle,
  categories,
  activeCategory,
  timeRange = 'weekly',
  metrics,
  clientsWithDebt = [],
  pendingInvoices = [],
  onCategoryChange,
  onTimeRangeChange,
  onViewMore
}) => {
  // Helper function to get color classes based on accent color
  const getColorClasses = (accentColor: string, isActive: boolean) => {
    const colorMap: Record<string, any> = {
      orange: {
        active: {
          bg: "bg-orange-100 dark:bg-orange-900/20",
          text: "text-orange-800 dark:text-orange-400"
        },
        activeBg: "bg-orange-500"
      },
      blue: {
        active: {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          text: "text-blue-800 dark:text-blue-400"
        },
        activeBg: "bg-blue-500"
      },
      green: {
        active: {
          bg: "bg-green-100 dark:bg-green-900/20",
          text: "text-green-800 dark:text-green-400"
        },
        activeBg: "bg-green-500"
      }
    };

    if (isActive && colorMap[accentColor]) {
      return colorMap[accentColor].active || { bg: "bg-primary/20", text: "text-primary" };
    }

    return { bg: "bg-muted", text: "text-foreground hover:bg-accent" };
  };

  // Get counts for each category
  const getCategoryCount = (category: string) => {
    if (!pendingInvoices) return 0;

    if (category === 'All Clients') return pendingInvoices.length;
    if (category === 'Delivered') return pendingInvoices.filter(inv => inv.status === 'delivered').length;
    if (category === 'Not Delivered') return pendingInvoices.filter(inv =>
      inv.status === 'not_delivered' || inv.status === 'pending' || inv.status === 'partially_paid'
    ).length;

    return 0;
  };

  // Generate initials from client name
  const getInitials = (name: string): string => {
    if (!name) return '--';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background color based on client name
  const getAvatarColor = (name: string): string => {
    if (!name) return 'bg-primary/20 text-primary';
    const colors = [
      'bg-orange-500/20 text-orange-500',
      'bg-blue-500/20 text-blue-500',
      'bg-green-500/20 text-green-500',
      'bg-purple-500/20 text-purple-500',
      'bg-red-500/20 text-red-500',
      'bg-teal-500/20 text-teal-500',
      'bg-indigo-500/20 text-indigo-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {icon}
            {title}
            <button className="ml-1 text-muted-foreground hover:text-foreground">
              <Info size={16} />
            </button>
          </CardTitle>
          <div className="flex flex-col mt-1">
            <div className="flex items-center">
              <span className="text-2xl font-bold">{total}</span>
              <Badge
                className={cn(
                  "ml-2 px-1.5 py-0.5 text-xs",
                  change.startsWith('+') ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                  "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                )}
              >
                {change}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground mt-0.5">{subtitle}</span>
          </div>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs h-8 px-3"
              >
                {timeRange === 'daily' ? 'Daily' :
                 timeRange === 'weekly' ? 'Weekly' :
                 timeRange === 'monthly' ? 'Monthly' : 'Custom'}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                className={cn("text-xs", timeRange === 'daily' && "bg-muted")}
                onClick={() => onTimeRangeChange && onTimeRangeChange('daily')}
              >
                Daily
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn("text-xs", timeRange === 'weekly' && "bg-muted")}
                onClick={() => onTimeRangeChange && onTimeRangeChange('weekly')}
              >
                Weekly
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn("text-xs", timeRange === 'monthly' && "bg-muted")}
                onClick={() => onTimeRangeChange && onTimeRangeChange('monthly')}
              >
                Monthly
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Category tabs */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => {
              const isActive = category === activeCategory;
              const colorClasses = getColorClasses(accentColor, isActive);

              return (
                <button
                  key={category}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-2",
                    isActive ? `${colorClasses.bg} ${colorClasses.text}` : "bg-muted text-foreground hover:bg-accent"
                  )}
                  onClick={() => onCategoryChange && onCategoryChange(category)}
                >
                  <span>{category}</span>
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-full text-xs px-1.5 min-w-[20px] h-5",
                    isActive ? "bg-white/20" : "bg-muted-foreground/20"
                  )}>
                    {getCategoryCount(category)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>



        {/* Client cards section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Clients with Pending Invoices</div>
            {pendingInvoices && pendingInvoices.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex items-center gap-1 h-7 px-2"
                onClick={onViewMore}
              >
                View All <ExternalLink size={12} />
              </Button>
            )}
          </div>

          {/* Client cards */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {pendingInvoices && pendingInvoices.length > 0 ? (
              pendingInvoices
                .filter(invoice => {
                  // Apply category filter
                  if (activeCategory === 'All Clients') return true;
                  if (activeCategory === 'Delivered') return invoice.status === 'delivered';
                  if (activeCategory === 'Not Delivered') return invoice.status === 'not_delivered' || invoice.status === 'pending' || invoice.status === 'partially_paid';
                  return true;
                })
                .sort((a, b) => b.amount - a.amount)
                .map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer group hover:translate-y-[-2px] duration-200"
                    onClick={() => window.location.href = `/dashboard/orders?client=${invoice.clientName}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className={`h-9 w-9 ${getAvatarColor(invoice.clientName)}`}>
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(invoice.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{invoice.clientName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium">
                        {formatCurrency(invoice.amount).replace('UGX', '').trim()}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {invoice.status === 'pending' ? 'Pending' :
                         invoice.status === 'partially_paid' ? 'Partially Paid' :
                         invoice.status === 'delivered' ? 'Delivered' : 'Not Delivered'}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                No pending invoices found
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingInvoicesCard;
