'use client';

import React, { useRef, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { pieChartOptions, chartColors } from '@/lib/chart-config';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface GaugeChartProps {
  value: number;
  max?: number;
  height?: number;
  className?: string;
  showValue?: boolean;
  valueLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function GaugeChartComponent({
  value,
  max = 100,
  height = 200,
  className,
  showValue = true,
  valueLabel = 'SPEND',
  valuePrefix = '$',
  valueSuffix = '',
}: GaugeChartProps) {
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const remaining = 100 - percentage;

  // Format value
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

  // Create chart data
  const data: ChartData<'doughnut'> = {
    labels: ['Value', 'Remaining'],
    datasets: [
      {
        data: [percentage, remaining],
        backgroundColor: [
          isDarkTheme ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)', // Bright blue for value
          isDarkTheme ? 'rgba(51, 51, 51, 0.5)' : 'rgba(229, 231, 235, 0.5)', // Semi-transparent gray for remaining
        ],
        borderWidth: 0,
        circumference: 180, // Half circle (180 degrees)
        rotation: 270, // Start from the bottom
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'doughnut'> = {
    ...pieChartOptions as ChartOptions<'doughnut'>,
    cutout: '85%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    scales: {
      // Remove all scales (axes)
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  // Update chart colors when theme changes
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.datasets[0].backgroundColor = [
        isDarkTheme ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)', // Bright blue for value
        isDarkTheme ? 'rgba(51, 51, 51, 0.5)' : 'rgba(229, 231, 235, 0.5)', // Semi-transparent gray for remaining
      ];
      chart.update();
    }
  }, [isDarkTheme]);

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <Doughnut
        ref={chartRef}
        data={data}
        options={options}
        height={height}
      />

      {showValue && (
        <div className="absolute inset-0 flex flex-col justify-center items-center"
             style={{
               pointerEvents: 'none' // Ensure it doesn't interfere with chart interactions
             }}>
          <div className="flex flex-col items-center justify-center"
               style={{
                 marginTop: '10px'
               }}>
            <span className="text-xs text-muted-foreground uppercase">{valueLabel}</span>
            <span className="text-xl font-bold whitespace-nowrap">
              {valuePrefix}{formattedValue}{valueSuffix}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
