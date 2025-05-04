'use client';

import React, { useState } from 'react';
import { StockMarketTracker } from '@/components/analytics/StockMarketTracker';

export default function StockDemoPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('ACME');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1W');

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setSelectedTimeRange(timeRange);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Stock Market Tracker Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StockMarketTracker 
          stockSymbol={selectedSymbol}
          stockName={`${selectedSymbol} CORPORATION`}
          initialTimeRange={'1W' as any}
          onSymbolChange={handleSymbolChange}
          onTimeRangeChange={handleTimeRangeChange}
        />
        
        <div className="bg-card dark:bg-gray-900 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Component Details</h2>
          <p className="text-muted-foreground mb-4">
            This Stock Market Tracker component demonstrates how to create a financial chart using Chart.js. 
            It includes features like:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Time range selection (1D, 1W, 1M, 3M, 1Y)</li>
            <li>Stock symbol selection via dropdown</li>
            <li>Responsive line chart with hover effects</li>
            <li>Price and percentage change indicators</li>
            <li>High/Low/Open price display</li>
          </ul>
          
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Current Selection:</h3>
            <p>Symbol: <span className="font-mono">{selectedSymbol}</span></p>
            <p>Time Range: <span className="font-mono">{selectedTimeRange}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
