'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugMaterialPurchasesPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/material-purchases');
      
      if (!response.ok) {
        throw new Error(`Error fetching debug data: ${response.status}`);
      }
      
      const data = await response.json();
      setDebugData(data.data.debug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching debug data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Material Purchases</h1>
      
      <Button 
        onClick={fetchDebugData} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Loading...' : 'Refresh Data'}
      </Button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {debugData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><strong>All Purchases:</strong> {debugData.allPurchasesCount}</li>
                <li><strong>With Installment Plans:</strong> {debugData.installmentPurchasesCount}</li>
                <li><strong>With Next Payment Date:</strong> {debugData.nextPaymentPurchasesCount}</li>
                <li><strong>Unpaid/Partially Paid:</strong> {debugData.unpaidPurchasesCount}</li>
                <li><strong>Installments:</strong> {debugData.installmentsCount}</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Purchases with Installment Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <pre className="text-xs">{JSON.stringify(debugData.installmentPurchases, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Purchases with Next Payment Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <pre className="text-xs">{JSON.stringify(debugData.nextPaymentPurchases, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Installments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <pre className="text-xs">{JSON.stringify(debugData.installments, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
