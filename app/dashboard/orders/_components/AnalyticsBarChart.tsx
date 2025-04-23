'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Tooltip,
  TooltipProps
} from 'recharts';
import { cn } from '@/lib/utils';

interface AnalyticsBarChartProps {
  data: {
    name: string;
    value: number;
    isActive?: boolean;
  }[];
  average?: number;
  height?: number;
  accentColor: string;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  showAverage?: boolean;
  valueFormatter?: (value: number) => string;
}

const AnalyticsBarChart: React.FC<AnalyticsBarChartProps> = ({
  data,
  average,
  height = 150,
  accentColor = 'orange',
  showXAxis = true,
  showYAxis = false,
  showGrid = false,
  showAverage = true,
  valueFormatter = (value: number) => value.toString()
}) => {
  // Get color based on accent color
  const getBarColor = (isActive: boolean = false) => {
    const colorMap: Record<string, { active: string, inactive: string }> = {
      orange: { active: '#f97316', inactive: '#f3f4f6' },
      blue: { active: '#3b82f6', inactive: '#f3f4f6' },
      green: { active: '#22c55e', inactive: '#f3f4f6' },
      purple: { active: '#a855f7', inactive: '#f3f4f6' }
    };

    return isActive
      ? colorMap[accentColor]?.active || '#a855f7'
      : colorMap[accentColor]?.inactive || '#f3f4f6';
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  // Calculate average if not provided
  const calculatedAverage = average || (data.length > 0 ?
    data.reduce((sum, item) => sum + item.value, 0) / data.length : 0);

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="w-full h-32 relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Average label - only show on hover */}
      {showAverage && calculatedAverage > 0 && isHovering && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-background text-xs text-muted-foreground px-1 rounded z-10 transition-opacity duration-200">
          <span className="font-medium">Avg: {valueFormatter(calculatedAverage)}</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}

          {showXAxis && (
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dy={5}
            />
          )}

          {showYAxis && (
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dx={-5}
            />
          )}

          {showAverage && calculatedAverage > 0 && isHovering && (
            <ReferenceLine
              y={calculatedAverage}
              stroke="#374151"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
              className="transition-opacity duration-200"
            />
          )}

          <Tooltip
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border border-border rounded-md shadow-sm p-2 text-xs">
                    <p className="font-medium">{payload[0].payload.name}</p>
                    <p className="text-muted-foreground">
                      {valueFormatter(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.isActive)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsBarChart;
