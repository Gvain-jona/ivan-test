'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useHomePage } from '../_context/HomePageContext';

interface HomePageHeaderProps {
  title: string;
  description: string;
}

/**
 * Header component for the home page with title, description, and refresh button
 */
const HomePageHeader: React.FC<HomePageHeaderProps> = ({ title, description }) => {
  const { refreshData, initialLoading } = useHomePage();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={refreshData}
        disabled={initialLoading}
        className="h-9 gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${initialLoading ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </Button>
    </div>
  );
};

export default HomePageHeader;
