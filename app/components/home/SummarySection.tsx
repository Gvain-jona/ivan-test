'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SummaryItem } from '../../types';
import { cn } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, BarChart2, Plus } from 'lucide-react';

interface SummarySectionProps {
  title: string;
  items: SummaryItem[];
  viewAllLink: string;
  addLink?: string;
  addLabel?: string;
  isLoading?: boolean;
  renderRow?: (item: SummaryItem) => React.ReactNode;
  renderHeaders?: () => React.ReactNode;
  showStatus?: boolean;
  showAmount?: boolean;
  emptyMessage?: string;
  highlightCondition?: (item: SummaryItem) => boolean;
}

export default function SummarySection({
  title,
  items,
  viewAllLink,
  addLink,
  addLabel = 'Add',
  isLoading = false,
  renderRow,
  renderHeaders,
  showStatus = false,
  showAmount = false,
  emptyMessage = 'No items to display',
  highlightCondition
}: SummarySectionProps) {
  // For "Show More" functionality
  const [displayLimit, setDisplayLimit] = useState(3);
  
  // Update displayLimit based on screen size after component mounts
  useEffect(() => {
    setDisplayLimit(window.innerWidth > 1200 ? 10 : 3);
    
    // Add resize listener to adjust displayLimit on window resize
    const handleResize = () => {
      setDisplayLimit(window.innerWidth > 1200 ? 10 : 3);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Get status class
  const getStatusClass = (status: string | undefined) => {
    if (!status) return 'bg-gray-800 text-gray-300';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-900/40 text-green-300 border-green-500/30';
      case 'delivered':
        return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
      case 'in_progress':
      case 'in progress':
        return 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30';
      case 'pending':
        return 'bg-orange-900/40 text-orange-300 border-orange-500/30';
      case 'paused':
        return 'bg-red-900/40 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-800/40 text-gray-300 border-gray-500/30';
    }
  };

  // Handle show more
  const handleShowMore = () => {
    setDisplayLimit(displayLimit + 5);
  };

  if (isLoading) {
    return (
      <Card className="border-border/40 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
          <div className="flex space-x-2">
            {addLink && (
              <Button size="sm" variant="outline" asChild>
                <Link href={addLink} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>{addLabel}</span>
                </Link>
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link href={viewAllLink} className="gap-1">
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2 mb-4">
            {Array.from({ length: displayLimit }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-800/50 animate-pulse rounded-md"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedItems = items.slice(0, displayLimit);
  const hasMore = items.length > displayLimit;

  return (
    <Card className="border-border/40 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
          <span>{title}</span>
          {title.toLowerCase().includes('analytic') && <BarChart2 className="h-4 w-4 text-primary" />}
        </CardTitle>
        <div className="flex space-x-2">
          {addLink && (
            <Button size="sm" variant="outline" asChild>
              <Link href={addLink} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span>{addLabel}</span>
              </Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href={viewAllLink} className="gap-1">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="bg-gray-800/50 rounded-full p-3 mb-3">
              <BarChart2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-gray-400 text-center">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/40">
                  {renderHeaders ? (
                    renderHeaders()
                  ) : (
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 border-b border-border/40">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 border-b border-border/40">
                        Date
                      </th>
                      {showStatus && (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 border-b border-border/40">
                          Status
                        </th>
                      )}
                      {showAmount && (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 border-b border-border/40">
                          Amount
                        </th>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400 border-b border-border/40">
                        Action
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-border/20">
                  {renderRow ? (
                    displayedItems.map(renderRow)
                  ) : (
                    displayedItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className={cn(
                          "transition-colors hover:bg-gray-800/40",
                          highlightCondition && highlightCondition(item) && "bg-primary/5 hover:bg-primary/10"
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                          {item.title}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                          {formatDate(item.date)}
                        </td>
                        {showStatus && (
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {item.status && (
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusClass(item.status)}`}>
                                {item.status}
                              </span>
                            )}
                          </td>
                        )}
                        {showAmount && (
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-300">
                            {item.amount !== undefined && formatCurrency(item.amount)}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-right">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            asChild
                          >
                            <Link href={`${viewAllLink}/${item.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="mt-4 p-4 text-center">
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  className="w-full"
                >
                  Show More
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 