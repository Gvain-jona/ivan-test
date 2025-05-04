'use client';

import React, { useState } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';

export interface LineChartProps {
  data: any[];
  series: {
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
    type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
    dot?: boolean;
  }[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showReferenceLine?: boolean;
  referenceLineValue?: number;
  referenceLineLabel?: string;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
  className?: string;
}

export function LineChart({
  data,
  series,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showReferenceLine = false,
  referenceLineValue,
  referenceLineLabel,
  valueFormatter = (value: number) => value.toLocaleString(),
  dateFormatter = (date: string) => date,
  className
}: LineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      setActiveIndex(e.activeTooltipIndex);
    }
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-md shadow-md p-3">
          <p className="text-sm font-medium mb-1">{dateFormatter(label)}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">{entry.name}:</span>
                <span className="text-xs font-medium">{valueFormatter(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="var(--border)" 
              strokeOpacity={0.5}
            />
          )}
          
          <XAxis 
            dataKey={xAxisKey} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickFormatter={dateFormatter}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
            padding={{ left: 10, right: 10 }}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickFormatter={valueFormatter}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          
          {showTooltip && (
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
          )}
          
          {showLegend && (
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
          )}
          
          {showReferenceLine && referenceLineValue !== undefined && (
            <ReferenceLine 
              y={referenceLineValue} 
              stroke="var(--muted-foreground)" 
              strokeDasharray="3 3"
              label={referenceLineLabel ? {
                value: referenceLineLabel,
                position: 'right',
                fill: 'var(--muted-foreground)',
                fontSize: 12
              } : undefined}
            />
          )}
          
          {series.map((s, index) => (
            <Line
              key={`line-${index}`}
              type={s.type || "monotone"}
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.strokeWidth || 2}
              dot={s.dot !== false ? { r: 3, strokeWidth: 2, fill: 'var(--background)' } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChart;
