'use client';

import React from 'react';

interface GaugeChartComponentProps {
  value: number;
  max: number;
  height?: number;
  valuePrefix?: string;
  valueLabel?: string;
  className?: string;
}

export function GaugeChartComponent({ value, max, height = 180, valuePrefix = '', valueLabel = '', className }: GaugeChartComponentProps) {
  const percent = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className={className} style={{ height }}>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold">{valuePrefix}{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{valueLabel}</div>
        <div className="w-full mt-2 h-2 bg-muted rounded-full">
          <div className="h-2 bg-primary rounded-full" style={{ width: `${percent * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
