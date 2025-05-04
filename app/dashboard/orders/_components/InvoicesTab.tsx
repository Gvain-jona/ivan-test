'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DollarSign, Calendar, Filter, X, Search, FileText, ChevronDown } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import TablePagination from '@/app/components/ui/pagination/TablePagination';
import { useOrdersPage } from '../_context';
import { useOrdersData } from '@/hooks/useOrdersData';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PaymentStatusBadge from '@/components/ui/payment-status-badge';
import InvoiceButtonWrapper from './InvoiceSystem';

/**
 * Tab content for the Invoices tab in the Orders page
 */
const InvoicesTab: React.FC = () => {
  const {
    filteredOrders,
    loading: contextLoading,
    userRole,
    handleViewOrder,
    handleGenerateInvoice
  } = useOrdersPage();

  // Get loading state from the orders hook directly
  const { isLoading: ordersLoading } = useOrdersData();

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  const loading = contextLoading || ordersLoading;

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');

  // Section visibility state
  const [dueSoonVisible, setDueSoonVisible] = useState(true);
  const [allInvoicesVisible, setAllInvoicesVisible] = useState(true);

  // Toggle section visibility
  const toggleSection = useCallback((section: 'dueSoon' | 'allInvoices') => {
    switch (section) {
      case 'dueSoon':
        setDueSoonVisible(prev => !prev);
        break;
      case 'allInvoices':
        setAllInvoicesVisible(prev => !prev);
        break;
    }
  }, []);

  // Create a mapping between invoice IDs and original order objects for easy lookup
  const orderMap = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return new Map();
    }

    const map = new Map();
    filteredOrders.forEach(order => {
      map.set(order.id, order);
    });

    return map;
  }, [filteredOrders]);

  // Filter orders to get pending invoices
  const pendingInvoices = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return [];
    }

    return filteredOrders
      .filter(order => order.payment_status === 'unpaid' || order.payment_status === 'partially_paid')
      .map(order => {
        // Calculate payment percentage for partially paid orders
        const totalAmount = order.total_amount || 0;
        const amountPaid = order.amount_paid || 0;
        const paymentPercentage = totalAmount > 0 ? Math.round((amountPaid / totalAmount) * 100) : 0;

        // Process order items
        const items = order.items || [];
        const totalItems = items.length;
        const displayItems = items.slice(0, 3); // Only take first 3 items

        // Format items to show item_name, category_name, and size
        const formattedItems = displayItems.map(item => ({
          id: item.id,
          name: `${item.item_name || 'Unknown'} - ${item.category_name || 'Unknown'} (${item.size || 'N/A'})`,
          quantity: item.quantity || 0,
          unitPrice: item.unit_price || 0,
          totalAmount: item.total_amount || 0
        }));

        return {
          id: order.id,
          clientName: order.client_name || 'Unknown Client',
          amount: order.balance || 0,
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          paymentPercentage: paymentPercentage,
          dueDate: order.date || formatDate(new Date()),
          status: order.payment_status === 'unpaid' ? 'unpaid' : 'partially_paid',
          orderNumber: order.order_number || order.id.substring(0, 8),
          items: formattedItems,
          totalItems: totalItems
        };
      });
  }, [filteredOrders]);

  // Filter invoices based on sidebar selection and search term
  const getFilteredInvoices = () => {
    let filtered = pendingInvoices;

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.clientName.toLowerCase().includes(searchTermLower) ||
        invoice.orderNumber.toLowerCase().includes(searchTermLower) ||
        // Search in items
        invoice.items.some(item =>
          item.name.toLowerCase().includes(searchTermLower)
        )
      );
    }

    // Apply sidebar filter
    if (activeFilter === 'all') return filtered;
    if (activeFilter === 'unpaid') return filtered.filter(invoice => invoice.status === 'unpaid');
    if (activeFilter === 'partially_paid') return filtered.filter(invoice => invoice.status === 'partially_paid');

    return filtered;
  };

  const allFilteredInvoices = getFilteredInvoices();

  // Pagination logic
  const totalPages = Math.ceil(allFilteredInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedInvoices = allFilteredInvoices.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of invoice list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };



  // Generate initials from client name
  const getInitials = (name: string): string => {
    if (!name) return '--';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background color based on client name
  const getAvatarColor = (name: string): string => {
    if (!name) return 'bg-primary/20 text-primary';
    const colors = [
      'bg-orange-500/20 text-orange-500',
      'bg-blue-500/20 text-blue-500',
      'bg-green-500/20 text-green-500',
      'bg-purple-500/20 text-purple-500',
      'bg-red-500/20 text-red-500',
      'bg-teal-500/20 text-teal-500',
      'bg-indigo-500/20 text-indigo-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Calculate total amount due
  const totalAmountDue = useMemo(() => {
    return allFilteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  }, [allFilteredInvoices]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with title and search */}
      <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Pending Invoices</h2>
          <Badge variant="outline" className="bg-foreground/10 text-foreground/80">
            {pendingInvoices.length} total
          </Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-9 h-10 bg-muted/50 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Quick filters */}
      <div className="px-4 mb-4 flex flex-wrap gap-2">
        <button
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
            activeFilter === 'all'
              ? "bg-white text-black"
              : "bg-muted/50 text-foreground hover:bg-muted"
          )}
          onClick={() => setActiveFilter('all')}
        >
          All Invoices
          <Badge className={cn(
            "ml-1 text-xs",
            activeFilter === 'all' ? "bg-black text-white" : "bg-foreground/10 text-foreground/80"
          )}>
            {pendingInvoices.length}
          </Badge>
        </button>
        <button
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
            activeFilter === 'unpaid'
              ? "bg-white text-black"
              : "bg-muted/50 text-foreground hover:bg-muted"
          )}
          onClick={() => setActiveFilter('unpaid')}
        >
          Not Paid
          <Badge className={cn(
            "ml-1 text-xs",
            activeFilter === 'unpaid' ? "bg-black text-white" : "bg-foreground/10 text-foreground/80"
          )}>
            {pendingInvoices.filter(i => i.status === 'unpaid').length}
          </Badge>
        </button>
        <button
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
            activeFilter === 'partially_paid'
              ? "bg-white text-black"
              : "bg-muted/50 text-foreground hover:bg-muted"
          )}
          onClick={() => setActiveFilter('partially_paid')}
        >
          Partially Paid
          <Badge className={cn(
            "ml-1 text-xs",
            activeFilter === 'partially_paid' ? "bg-black text-white" : "bg-foreground/10 text-foreground/80"
          )}>
            {pendingInvoices.filter(i => i.status === 'partially_paid').length}
          </Badge>
        </button>
      </div>



      {/* Main content area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6">

        {/* Due Soon Section */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 text-lg font-medium hover:text-foreground/80 transition-colors"
                onClick={() => toggleSection('dueSoon')}
              >
                <h3>Due Soon</h3>
                <ChevronDown className={`h-5 w-5 transform transition-transform ${dueSoonVisible ? '' : 'rotate-180'}`} />
              </button>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                {pendingInvoices
                  .filter(invoice => {
                    const dueDate = new Date(invoice.dueDate);
                    const today = new Date();
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 7;
                  }).length} invoices
              </Badge>
            </div>
            <div className="text-sm font-medium text-orange-500">
              {formatCurrency(
                pendingInvoices
                  .filter(invoice => {
                    const dueDate = new Date(invoice.dueDate);
                    const today = new Date();
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 7;
                  })
                  .reduce((sum, invoice) => sum + invoice.amount, 0)
              )}
            </div>
          </div>
          {dueSoonVisible && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            {(() => {
              // Get current date
              const today = new Date();

              // Filter invoices that are due within the next 7 days
              const almostDueInvoices = pendingInvoices
                .filter(invoice => {
                  const dueDate = new Date(invoice.dueDate);
                  const diffTime = dueDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays >= 0 && diffDays <= 7; // Due within a week
                })
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 3); // Show top 3 most urgent

              if (almostDueInvoices.length === 0) {
                return (
                  <div className="col-span-full text-center py-4 bg-card border border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No invoices due soon</p>
                  </div>
                );
              }

              return almostDueInvoices.map((invoice, index) => {
                // Calculate days until due
                const dueDate = new Date(invoice.dueDate);
                const diffTime = dueDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <Card
                    key={index}
                    className="bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:translate-y-[-2px]"
                    onClick={() => setSelectedInvoice(invoice.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <div className="font-medium truncate">{invoice.clientName}</div>
                        <Badge
                          variant="outline"
                          className={`${daysLeft <= 2 ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'} text-xs`}
                        >
                          {daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft} days left`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">Order #{invoice.orderNumber}</div>
                        <div className="text-sm font-medium text-orange-500">
                          {formatCurrency(invoice.amount)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
            </div>
          )}
        </div>



        {/* All Pending Invoices Section */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 text-lg font-medium hover:text-foreground/80 transition-colors"
                onClick={() => toggleSection('allInvoices')}
              >
                <h3>All Pending Invoices</h3>
                <ChevronDown className={`h-5 w-5 transform transition-transform ${allInvoicesVisible ? '' : 'rotate-180'}`} />
              </button>
              <Badge variant="outline" className="bg-foreground/10 text-foreground/80">
                {displayedInvoices.length} of {allFilteredInvoices.length}
              </Badge>
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(totalAmountDue)}
            </div>
          </div>
          {allInvoicesVisible && (
            <>
              <div id="invoice-list-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {loading && pendingInvoices.length === 0 ? (
              // Loading skeletons - only show if we don't have any data yet
              Array(6).fill(0).map((_, index) => (
                <Card key={index} className="bg-card border-border shadow-sm animate-pulse h-[240px]">
                  <CardHeader className="h-16 bg-muted rounded-t-lg"></CardHeader>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-3"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))
            ) : displayedInvoices.length === 0 ? (
              <div className="col-span-full text-center py-8 px-4 rounded-lg border border-dashed border-border bg-card">
                <h3 className="text-xl font-medium text-foreground mb-2">No pending invoices found</h3>
                <p className="text-muted-foreground">
                  There are no pending invoices matching your current filters.
                </p>
              </div>
            ) : (
              displayedInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={cn(
                    "bg-card border-border rounded-lg shadow-sm transition-all cursor-pointer h-auto flex flex-col",
                    selectedInvoice === invoice.id ? "ring-1 ring-foreground/20 border-foreground/20" : "",
                    "hover:shadow-lg hover:border-foreground/10 hover:bg-card/95 hover:translate-y-[-2px] active:scale-[0.99] active:shadow-sm"
                  )}
                  onClick={() => setSelectedInvoice(invoice.id)}
                >
                  {/* Payment Status at the top */}
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-center">
                      <PaymentStatusBadge
                        status={invoice.status}
                        percentage={invoice.paymentPercentage}
                        showPercentage={true}
                      />
                      <div className="text-sm font-medium">
                        {invoice.orderNumber}
                      </div>
                    </div>
                  </CardHeader>

                  <Separator />

                  {/* Client Information */}
                  <CardContent className="p-3 pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className={`h-10 w-10 ${getAvatarColor(invoice.clientName)}`}>
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(invoice.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <h3 className="text-base font-semibold text-foreground">{invoice.clientName}</h3>
                        <p className="text-xs text-muted-foreground">
                          Regular Client
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  <Separator />

                  {/* Amount and Due Date Section */}
                  <CardContent className="p-3 pb-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex flex-col mb-2">
                          <span className="text-xs text-muted-foreground">Total Amount</span>
                          <span className="text-sm font-medium text-foreground">{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Amount Due</span>
                          <span className="text-sm font-medium text-foreground text-red-400">{formatCurrency(invoice.amount)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <span className="text-xs text-muted-foreground">Due Date</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{formatDate(invoice.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <Separator />

                  {/* Order Items Section */}
                  <CardContent className="p-3 pb-2 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Order Items</span>
                      <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/30">
                        {invoice.totalItems} {invoice.totalItems === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>

                    {invoice.items && invoice.items.length > 0 ? (
                      <div className="space-y-2">
                        {invoice.items.map((item, index) => (
                          <div key={item.id || index} className="border-b border-border/30 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 truncate">
                                <p className="text-xs font-medium truncate">{item.name}</p>
                              </div>
                              <div className="text-xs text-muted-foreground ml-2">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {invoice.totalItems > 3 && (
                          <div className="text-center mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2 text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder({ id: invoice.id });
                              }}
                            >
                              + {invoice.totalItems - 3} more items
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        No items found
                      </div>
                    )}
                  </CardContent>

                  <div className="mt-auto">
                    <Separator />

                    {/* Action Buttons */}
                    <CardContent className="p-3">
                      <div className="flex justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 bg-transparent border-foreground/20 text-foreground hover:bg-foreground/5 hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder({ id: invoice.id });
                          }}
                        >
                          View Order
                        </Button>
                        <div className="flex-1">
                          <InvoiceButtonWrapper
                            order={orderMap.get(invoice.id) || { id: invoice.id }}
                            variant="default"
                            size="sm"
                            label="Generate Invoice"
                            className="w-full h-9 bg-foreground text-background hover:bg-foreground/90"
                            useContextHandler={true}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
              </div>

              {/* Pagination */}
              <div className="flex justify-end mt-4">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={allFilteredInvoices.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[4, 8, 12, 16, 24]}
                  className="flex-shrink-0"
                  isLoading={loading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesTab;
