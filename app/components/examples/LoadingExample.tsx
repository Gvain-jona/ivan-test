'use client';

import { useState } from 'react';
import { useFetch } from '@/hooks/loading';
import { useLoading, LoadingIndicator, LoadingButton } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example component demonstrating the new loading system
 */
export function LoadingExample() {
  const [shouldFetch, setShouldFetch] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Example of using the useFetch hook with loading state
  const { data, error, isLoading } = useFetch(
    shouldFetch ? '/api/orders' : null,
    'orders-example'
  );

  // Example of manually controlling loading state
  const handleManualLoading = () => {
    setIsManualLoading(true);
    startLoading('manual-example');

    // Simulate a long-running operation
    setTimeout(() => {
      stopLoading('manual-example');
      setIsManualLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Loading System Examples</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example 1: SWR with Loading State */}
        <Card>
          <CardHeader>
            <CardTitle>SWR with Loading State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This example demonstrates using the useFetch hook with the loading provider.
            </p>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShouldFetch(!shouldFetch)}
                variant="outline"
              >
                {shouldFetch ? 'Stop Fetching' : 'Start Fetching'}
              </Button>

              <LoadingIndicator id="orders-example" text="Fetching orders..." />
            </div>

            {data && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                Error: {error.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example 2: Manual Loading State */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Loading State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This example demonstrates manually controlling the loading state.
            </p>

            <div className="flex items-center space-x-2">
              <LoadingButton
                onClick={handleManualLoading}
                isLoading={isManualLoading}
                loadingText="Loading..."
              >
                Start Loading
              </LoadingButton>

              <LoadingIndicator id="manual-example" text="Manual loading..." />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
