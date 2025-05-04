'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketingChannel {
  name: string;
  percentage: number;
  color: string;
}

interface MarketingMetric {
  name: string;
  value: string;
  change: number;
}

interface MarketingChannelsCardProps {
  title?: string;
  value: string | number;
  change?: {
    value: number;
    timeframe?: string;
  };
  channels: MarketingChannel[];
  metrics: MarketingMetric[];
  className?: string;
  onDetailsClick?: () => void;
  onViewReportsClick?: () => void;
}

export function MarketingChannelsCard({
  title = "Marketing Channels",
  value,
  change,
  channels,
  metrics,
  className,
  onDetailsClick,
  onViewReportsClick,
}: MarketingChannelsCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-card", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
            <InfoIcon className="h-4 w-4 text-muted-foreground/50" />
          </div>
          {onDetailsClick && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-md"
              onClick={onDetailsClick}
            >
              Details
            </Button>
          )}
        </div>

        <div className="flex flex-col">
          <div className="text-4xl font-bold">{value}</div>
          {change && (
            <div className={cn(
              "text-sm font-medium mt-1 flex items-center",
              change.value > 0 ? "text-green-500" : change.value < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {change.value > 0 ? '+' : ''}{change.value.toFixed(1)}%
              {change.timeframe && <span className="text-muted-foreground ml-1">{change.timeframe}</span>}
            </div>
          )}
        </div>

        {/* Channel Progress Bars */}
        <div className="mt-4 space-y-2">
          <div className="flex gap-[2px] h-4 w-full">
            {channels.map((channel, index) => (
              <div 
                key={index}
                className="h-full rounded-sm"
                style={{ 
                  backgroundColor: channel.color,
                  width: `${channel.percentage}%`
                }}
              />
            ))}
          </div>
          
          <div className="flex justify-between">
            {channels.map((channel, index) => (
              <div key={index} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: channel.color }}
                />
                <span className="text-xs">{channel.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Table */}
        <div className="mt-6 border-t border-border pt-4">
          <div className="grid grid-cols-3 text-sm mb-2">
            <div className="text-muted-foreground">Channels</div>
            <div className="text-muted-foreground">Metric</div>
            <div className="text-muted-foreground text-right">Total</div>
          </div>
          
          {metrics.map((metric, index) => (
            <div key={index} className="grid grid-cols-3 text-sm py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                {metric.name === 'Acquisition' && (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                )}
                {metric.name === 'Conversion' && (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                )}
                {metric.name === 'ROI' && (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                )}
                <span>{metric.name}</span>
              </div>
              <div>{metric.value}</div>
              <div className="flex items-center justify-end gap-1">
                <span>{metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%</span>
                {metric.change > 0 ? (
                  <ArrowUpIcon className="h-3 w-3 text-green-500" />
                ) : metric.change < 0 ? (
                  <ArrowDownIcon className="h-3 w-3 text-red-500" />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* View Reports Button */}
        <div className="mt-4">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={onViewReportsClick}
          >
            View reports
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
