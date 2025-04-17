'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  FileText, 
  LayoutGrid, 
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { 
  getStorageSummary, 
  formatBytes, 
  performCleanup, 
  CleanupTarget 
} from '@/app/lib/cleanup-utils';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

export function CacheCleanupCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [storageSummary, setStorageSummary] = useState<{
    totalSize: number;
    totalItems: number;
    categories: Record<string, { count: number; size: number }>;
  }>({ totalSize: 0, totalItems: 0, categories: {} });

  // Refresh storage summary
  const refreshSummary = () => {
    if (typeof window !== 'undefined') {
      const summary = getStorageSummary();
      setStorageSummary(summary);
    }
  };

  // Load initial summary
  useEffect(() => {
    refreshSummary();
  }, []);

  // Handle cleanup
  const handleCleanup = async (target: CleanupTarget) => {
    setIsLoading(true);
    
    try {
      // Perform cleanup
      const result = performCleanup(target);
      
      // Show success toast
      toast({
        title: 'Cleanup Complete',
        description: `Removed ${result.localStorageCount} cached items`,
        variant: 'default',
      });
      
      // Refresh summary
      refreshSummary();
    } catch (error) {
      console.error('Error during cleanup:', error);
      
      // Show error toast
      toast({
        title: 'Cleanup Failed',
        description: 'An error occurred while cleaning up cached data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-primary" />
          Cache Management
        </CardTitle>
        <CardDescription>
          Manage cached data to improve application performance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Storage Usage Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Storage Usage</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={refreshSummary}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Size</span>
              <span className="font-medium">{formatBytes(storageSummary.totalSize)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{storageSummary.totalItems}</span>
            </div>
            
            <Progress 
              value={Math.min(100, (storageSummary.totalSize / (5 * 1024 * 1024)) * 100)} 
              className="h-2"
            />
          </div>
          
          {/* Category Breakdown */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.entries(storageSummary.categories || {}).map(([category, data]) => (
              <div key={category} className="bg-muted/40 p-2 rounded-md">
                <div className="flex justify-between text-xs">
                  <span className="capitalize">{category}</span>
                  <span>{data.count} items</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatBytes(data.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Cleanup Options */}
        <div className="pt-4">
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All Data</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="dropdowns">Dropdowns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="text-sm">
                <p>Clean up all cached data to improve application performance. This will:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Clear all form data</li>
                  <li>Reset dropdown caches</li>
                  <li>Clear order data cache</li>
                  <li>Reset SWR cache</li>
                </ul>
              </div>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => handleCleanup('all')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clean All Cached Data
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="forms" className="space-y-4">
              <div className="text-sm">
                <p>Clear saved form data and drafts. This will:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Remove all saved form drafts</li>
                  <li>Clear form state data</li>
                  <li>Reset form validation states</li>
                </ul>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleCleanup('forms')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Clear Form Data
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              <div className="text-sm">
                <p>Clear cached order data. This will:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Reset order list cache</li>
                  <li>Clear order details cache</li>
                  <li>Force refresh of order data</li>
                </ul>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleCleanup('orders')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Clear Order Cache
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="dropdowns" className="space-y-4">
              <div className="text-sm">
                <p>Clear dropdown cache data. This will:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li>Reset client dropdown cache</li>
                  <li>Clear category dropdown cache</li>
                  <li>Reset item dropdown cache</li>
                </ul>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleCleanup('dropdowns')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Clear Dropdown Cache
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 mr-1" />
          Cleaning cache will not delete any of your data
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={refreshSummary}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
