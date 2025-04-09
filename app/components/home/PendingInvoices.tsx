'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PendingInvoice } from '../../types';

interface PendingInvoicesProps {
  invoices: PendingInvoice[];
  isLoading?: boolean;
}

export default function PendingInvoices({ invoices, isLoading = false }: PendingInvoicesProps) {
  // Initialize with a sensible default before we know window size
  const [displayLimit, setDisplayLimit] = useState(3); 
  
  // Set the displayLimit after component mounts based on window size
  useEffect(() => {
    setDisplayLimit(window.innerWidth > 1200 ? 10 : 3);
    
    // Optional: Add resize listener to adjust displayLimit on window resize
    const handleResize = () => {
      setDisplayLimit(window.innerWidth > 1200 ? 10 : 3);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Handle show more
  const handleShowMore = () => {
    setDisplayLimit(displayLimit + 5);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-gray-900 p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Pending Invoices</h3>
          <Link href="/dashboard/orders?filter=pending_payment" className="text-sm text-orange-500 hover:text-orange-400">
            View All
          </Link>
        </div>
        
        <div className="space-y-2 mb-4">
          {Array.from({ length: displayLimit }).map((_, index) => (
            <div key={index} className="h-16 bg-gray-800 animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  const displayedInvoices = invoices.slice(0, displayLimit);
  const hasMore = invoices.length > displayLimit;

  return (
    <div className="rounded-lg bg-gray-900 p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Pending Invoices</h3>
        <Link href="/dashboard/orders?filter=pending_payment" className="text-sm text-orange-500 hover:text-orange-400">
          View All
        </Link>
      </div>

      {displayedInvoices.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No pending invoices</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {displayedInvoices.map((invoice) => (
                  <tr key={invoice.order_id} className="bg-orange-900 bg-opacity-20 hover:bg-opacity-30">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      #{invoice.order_id.substring(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {invoice.client_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-orange-400 font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-right">
                      <Link 
                        href={`/dashboard/orders/${invoice.order_id}`}
                        className="bg-gray-800 hover:bg-gray-700 text-orange-500 px-3 py-1 rounded-md text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={handleShowMore}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Show More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 