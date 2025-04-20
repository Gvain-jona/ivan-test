'use client';

import React, { useState, useMemo } from 'react';
import { DollarSign, Calendar, Filter, X, Search } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import TablePagination from '../../../components/ui/table/TablePagination';
import { useOrdersPage } from '../_context/OrdersPageContext';
import { useOrdersData } from '@/hooks/useOrdersData';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PaymentStatusBadge from '@/components/ui/payment-status-badge';

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

    if (activeFilter === 'high_amount') return filtered.filter(invoice => invoice.amount > 500000); // Example threshold

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
    const invoiceListElement = document.getElementById('invoice-list-container');
    if (invoiceListElement) {
      invoiceListElement.scrollTop = 0;
    }
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
      {/* Header with title and pagination */}
      <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Hide filter button for now - will be improved later */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0"
          >
            {showFilters ? <X className="h-4 w-4 mr-1" /> : <Filter className="h-4 w-4 mr-1" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button> */}
          <h2 className="text-xl font-semibold text-foreground">Pending Invoices</h2>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={allFilteredInvoices.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[4, 8, 12, 16, 24]}
          className="flex-shrink-0"
        />
      </div>

      {/* Search and filters container */}
      <div className="px-4 mb-4 flex items-center gap-4">
        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
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
          <button
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
              activeFilter === 'high_amount'
                ? "bg-white text-black"
                : "bg-muted/50 text-foreground hover:bg-muted"
            )}
            onClick={() => setActiveFilter('high_amount')}
          >
            High Amount
            <Badge className={cn(
              "ml-1 text-xs",
              activeFilter === 'high_amount' ? "bg-black text-white" : "bg-foreground/10 text-foreground/80"
            )}>
              {pendingInvoices.filter(i => i.amount > 500000).length}
            </Badge>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client name, order number, or item..."
            className="w-full pl-9 h-10 bg-muted/50 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main content area with flex layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Filters - Always full height */}
        <div className={cn(
          "border-r border-border h-full flex-shrink-0 transition-all duration-300",
          showFilters ? "w-56" : "w-0 opacity-0"
        )}>
          {showFilters && (
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="text-lg font-medium mb-4 text-foreground sticky top-0 bg-background pt-1 pb-2 z-10">Filters</h3>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeFilter === 'all' && "bg-foreground/10 font-medium"
                  )}
                  onClick={() => setActiveFilter('all')}
                >
                  All Invoices
                  <Badge className="ml-auto bg-foreground/10 text-foreground/80">{pendingInvoices.length}</Badge>
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeFilter === 'unpaid' && "bg-foreground/10 font-medium"
                  )}
                  onClick={() => setActiveFilter('unpaid')}
                >
                  Not Paid
                  <Badge className="ml-auto bg-foreground/10 text-foreground/80">
                    {pendingInvoices.filter(i => i.status === 'unpaid').length}
                  </Badge>
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeFilter === 'partially_paid' && "bg-foreground/10 font-medium"
                  )}
                  onClick={() => setActiveFilter('partially_paid')}
                >
                  Partially Paid
                  <Badge className="ml-auto bg-foreground/10 text-foreground/80">
                    {pendingInvoices.filter(i => i.status === 'partially_paid').length}
                  </Badge>
                </Button>

                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeFilter === 'high_amount' && "bg-foreground/10 font-medium"
                  )}
                  onClick={() => setActiveFilter('high_amount')}
                >
                  High Amount
                  <Badge className="ml-auto bg-foreground/10 text-foreground/80">
                    {pendingInvoices.filter(i => i.amount > 500000).length}
                  </Badge>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Middle Section - Invoice Cards */}
        <div id="invoice-list-container" className="flex-1 px-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
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
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 h-9 bg-foreground text-background hover:bg-foreground/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Get the full order object from the map
                            const fullOrder = orderMap.get(invoice.id);
                            if (fullOrder) {
                              handleGenerateInvoice(fullOrder);
                            } else {
                              // Fallback to just using the ID if the full order isn't found
                              handleGenerateInvoice({ id: invoice.id });
                            }
                          }}
                        >
                          Generate Invoice
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar - Invoice Summary - Always full height */}
        <div className="w-80 border-l border-border h-full flex-shrink-0 bg-[#1A1A1A] rounded-tr-xl rounded-br-xl">
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-white sticky top-0 bg-[#1A1A1A] pt-1 pb-2 z-10">
              Invoice Summary
            </h3>
            <div className="space-y-4">
              {/* Invoice Summary Metrics */}
              <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                <h4 className="text-sm font-medium text-white mb-3">Financial Overview</h4>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333]">
                    <div className="text-xl font-bold text-white">{pendingInvoices.length}</div>
                    <div className="text-xs text-gray-400">Total Invoices</div>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333]">
                    <div className="text-base font-bold text-green-500 truncate">
                      {formatCurrency(totalAmountDue).replace('UGX', '').trim()}
                    </div>
                    <div className="text-xs text-gray-400">Total Amount Due</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Not Paid</span>
                    <span className="text-sm text-white">
                      {pendingInvoices.filter(i => i.status === 'unpaid').length} invoices
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Partially Paid</span>
                    <span className="text-sm text-white">
                      {pendingInvoices.filter(i => i.status === 'partially_paid').length} invoices
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">High Amount</span>
                    <span className="text-sm text-white">
                      {pendingInvoices.filter(i => i.amount > 500000).length} invoices
                    </span>
                  </div>
                </div>
              </div>

              {/* Almost Due Invoices */}
              <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                <h4 className="text-sm font-medium text-white mb-3">Almost Due</h4>

                <div className="space-y-3">
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
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-400">No invoices due soon</p>
                        </div>
                      );
                    }

                    return almostDueInvoices.map((invoice, index) => {
                      // Calculate days until due
                      const dueDate = new Date(invoice.dueDate);
                      const diffTime = dueDate.getTime() - today.getTime();
                      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                      return (
                        <div
                          key={index}
                          className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333] cursor-pointer hover:border-[#444444] hover:translate-y-[-2px] hover:shadow-md transition-all duration-200"
                          onClick={() => setSelectedInvoice(invoice.id)}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-medium text-sm text-white truncate">{invoice.clientName}</div>
                            <Badge
                              variant="outline"
                              className={`${daysLeft <= 2 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'} text-xs`}
                            >
                              {daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft} days left`}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">Order #{invoice.orderNumber}</div>
                            <div className="text-xs text-green-400 font-medium">
                              {formatCurrency(invoice.amount).replace('UGX', '').trim()}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                <h4 className="text-sm font-medium text-white mb-3">Recent Invoices</h4>

                <div className="space-y-3">
                  {pendingInvoices.length > 0 ? (
                    pendingInvoices
                      .slice(0, 3)
                      .map((invoice, index) => (
                        <div
                          key={index}
                          className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333] cursor-pointer hover:border-[#444444] hover:translate-y-[-2px] hover:shadow-md transition-all duration-200"
                          onClick={() => setSelectedInvoice(invoice.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-white">{invoice.clientName}</div>
                            <PaymentStatusBadge
                              status={invoice.status}
                              percentage={invoice.paymentPercentage}
                              showPercentage={true}
                              className="scale-75 origin-right"
                            />
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-400">Order #{invoice.orderNumber}</div>
                            <div className="text-xs text-green-400 font-medium">
                              {formatCurrency(invoice.amount).replace('UGX', '').trim()}
                            </div>
                          </div>

                          {/* Item summary */}
                          {invoice.items && invoice.items.length > 0 && (
                            <div className="mt-1 bg-[#242424] rounded p-1 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-400 text-[10px]">Items</span>
                                <span className="text-orange-400 text-[10px] font-medium">{invoice.totalItems} total</span>
                              </div>
                              {invoice.items.slice(0, 1).map((item, idx) => (
                                <div key={idx} className="text-[10px] text-gray-300 truncate">
                                  {item.quantity}× {item.name.split(' - ')[0]}
                                </div>
                              ))}
                              {invoice.totalItems > 1 && (
                                <div className="text-[10px] text-gray-400 italic">
                                  +{invoice.totalItems - 1} more
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      ))
                  ) : (
                    <div className="text-center py-3 bg-[#1A1A1A] rounded-lg border border-[#333333]">
                      <p className="text-sm text-gray-400">No pending invoices</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTab;
