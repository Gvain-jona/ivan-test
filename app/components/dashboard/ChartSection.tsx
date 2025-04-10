'use client';

import { useState } from 'react';
import { ArrowUpRight, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, GradientCard } from '../ui/card';
import { Button } from '../ui/button';

// Dummy data for the chart
const chartData = {
  labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  datasets: [
    {
      label: 'Revenue',
      data: [3484, 3950, 3800, 4200, 3950],
    },
  ],
};

interface ChartSectionProps {
  title?: string;
  isLoading?: boolean;
}

export default function ChartSection({ 
  title = "Revenue Overview", 
  isLoading = false 
}: ChartSectionProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '1y'>('7d');
  
  // Mock data for the chart
  const currentValue = 3484;
  const percentChange = 7.1;
  const trend = percentChange >= 0;
  
  if (isLoading) {
    return (
      <Card className="h-[400px] animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 w-1/3 bg-gray-800 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-gray-800/50 rounded-md"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <GradientCard className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          {title}
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-secondary/50 rounded-full overflow-hidden p-0.5">
            <Button 
              size="sm" 
              variant={timeframe === '7d' ? 'default' : 'ghost'} 
              className={`rounded-full text-xs h-7 px-3 ${timeframe === '7d' ? '' : 'hover:bg-secondary'}`}
              onClick={() => setTimeframe('7d')}
            >
              7 days
            </Button>
            <Button 
              size="sm" 
              variant={timeframe === '30d' ? 'default' : 'ghost'} 
              className={`rounded-full text-xs h-7 px-3 ${timeframe === '30d' ? '' : 'hover:bg-secondary'}`}
              onClick={() => setTimeframe('30d')}
            >
              30 days
            </Button>
            <Button 
              size="sm" 
              variant={timeframe === '1y' ? 'default' : 'ghost'} 
              className={`rounded-full text-xs h-7 px-3 ${timeframe === '1y' ? '' : 'hover:bg-secondary'}`}
              onClick={() => setTimeframe('1y')}
            >
              1 year
            </Button>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-3xl font-bold">
              {currentValue.toLocaleString()} <span className="text-muted-foreground">UGX</span>
            </div>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center gap-1 ${trend ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-sm font-medium">{trend ? '+' : '-'}{Math.abs(percentChange)}%</span>
                <ArrowUpRight className={`h-4 w-4 ${trend ? '' : 'rotate-180'}`} />
              </span>
              <span className="text-muted-foreground text-sm ml-2">vs previous</span>
            </div>
          </div>
        </div>
        
        {/* Chart placeholder - replace with actual chart component */}
        <div className="relative">
          <div className="w-full h-[200px] bg-gradient-to-t from-primary/5 to-transparent rounded-lg overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            
            {/* Mock chart line */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
              {/* Simulate gradient chart line */}
              <defs>
                <linearGradient id="chartLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="#ff6b00" />
                </linearGradient>
              </defs>
              
              {/* Simulate grid lines */}
              {[0, 10, 20, 30, 40, 50].map((value) => (
                <line 
                  key={value}
                  x1="0" 
                  y1={value} 
                  x2="100" 
                  y2={value} 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeDasharray="2,2"
                />
              ))}
              
              {/* Mock chart data path */}
              <path 
                d="M0,40 L20,35 L40,25 L60,30 L80,20 L100,10" 
                fill="none" 
                stroke="url(#chartLine)" 
                strokeWidth="2"
              />
              
              {/* Area under the chart */}
              <path 
                d="M0,40 L20,35 L40,25 L60,30 L80,20 L100,10 L100,50 L0,50 Z" 
                fill="url(#chartLine)" 
                opacity="0.1" 
              />
              
              {/* Data points */}
              {[
                {x: 0, y: 40},
                {x: 20, y: 35},
                {x: 40, y: 25},
                {x: 60, y: 30},
                {x: 80, y: 20},
                {x: 100, y: 10}
              ].map((point, i) => (
                <circle 
                  key={i}
                  cx={point.x} 
                  cy={point.y} 
                  r="1.5" 
                  fill="#fff" 
                  stroke="var(--primary)"
                  strokeWidth="1"
                />
              ))}
              
              {/* Hover point */}
              <circle 
                cx="80" 
                cy="20" 
                r="3" 
                fill="var(--primary)" 
                stroke="#fff"
                strokeWidth="1.5"
              />
            </svg>
            
            {/* X-axis labels */}
            <div className="flex justify-between px-4 mt-2">
              {chartData.labels.map((label, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </GradientCard>
  );
} 