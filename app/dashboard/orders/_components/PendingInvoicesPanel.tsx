'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Search, User, DollarSign, Calendar, Filter, AlertTriangle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PendingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'delivered' | 'not_delivered';
}

interface PendingInvoicesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingInvoices: PendingInvoice[];
}

const PendingInvoicesPanel: React.FC<PendingInvoicesPanelProps> = ({
  open,
  onOpenChange,
  pendingInvoices
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort invoices
  const filteredInvoices = pendingInvoices
    .filter(invoice => {
      // Apply search filter
      const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      } else if (sortBy === 'dueDate') {
        return sortOrder === 'desc'
          ? new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        return sortOrder === 'desc'
          ? b.clientName.localeCompare(a.clientName)
          : a.clientName.localeCompare(b.clientName);
      }
    });

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'delivered': return 'Delivered';
      case 'not_delivered': return 'Not Delivered';
      default: return 'Unknown';
    }
  };

  // Get status color - matching OrdersTable styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'delivered': return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'not_delivered': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle>Pending Invoices</SheetTitle>
              <SheetDescription>
                View and filter all pending invoices
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Search and filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name..."
              className="pl-9 h-10 bg-muted/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="not_delivered">Not Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy} className="flex-1">
                <SelectTrigger className="h-10 bg-muted/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="clientName">Client Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex-shrink-0 h-10 w-10 bg-muted/50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        <div className="text-sm font-medium mb-3 text-muted-foreground flex items-center justify-between">
          <span>Found {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}</span>
          {filteredInvoices.length > 0 && (
            <span>
              Total: {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </span>
          )}
        </div>

        {/* Invoices list */}
        <div className="space-y-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="relative border border-border rounded-lg shadow-sm group hover:translate-y-[-4px] transition-all duration-300 bg-card dark:bg-card/90"
              >
                {/* Ghost card effect on hover */}
                <div className="absolute inset-0 -bottom-2 -right-2 rounded-lg border border-border bg-card/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                <div className="p-4">
                  {/* Header with client info and status */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className={`h-10 w-10 ${getAvatarColor(invoice.clientName)}`}>
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(invoice.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-base">{invoice.clientName}</div>
                        <div className="text-xs text-muted-foreground">Regular Client</div>
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md shadow-sm ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-border/60 my-3"></div>
                  
                  {/* Invoice details */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Amount Due</div>
                        <div className="font-medium text-base">{formatCurrency(invoice.amount)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Due Date</div>
                        <div className="font-medium">
                          {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.location.href = `/dashboard/orders/${invoice.id}/invoice`}
                    >
                      View Invoice
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.location.href = `/dashboard/orders/${invoice.id}`}
                    >
                      View Order
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
              <div className="flex flex-col items-center justify-center gap-2">
                <Search className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="font-medium text-white">No invoices found</h3>
                <p className="text-sm text-muted-foreground/70">Try adjusting your filters or search term</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PendingInvoicesPanel;
