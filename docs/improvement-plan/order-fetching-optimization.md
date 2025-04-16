# Order Fetching Optimization Plan

This document outlines our plan to optimize and standardize the order fetching mechanisms used throughout the application, focusing on performance, code duplication, and caching strategies.

## Current Issues

### Multiple Fetching Mechanisms

1. **Duplicate Hooks**:
   - `useOrders` in `use-data.ts`
   - `useSWROrders` in `useSWROrders.ts`
   - `useRealOrders` in `useRealOrders.ts`
   - Direct API calls in various components

2. **Inconsistent Caching Strategies**:
   - Different deduping intervals
   - Aggressive cache-busting with `Date.now()`
   - Custom caching layers on top of SWR

3. **Prefetching Redundancy**:
   - Custom prefetching service with its own caching

4. **Multiple API Implementations**:
   - Direct Supabase queries
   - Database service abstraction
   - Data service with mock data

### Performance Issues

1. **Redundant Network Requests**:
   - Multiple components fetching the same data
   - No shared cache between components

2. **Inefficient Caching**:
   - Custom timeout-based caching
   - No proper invalidation strategy

3. **Large Data Transfers**:
   - Fetching all orders at once
   - No pagination or filtering on the server

### UX Issues

1. **Inconsistent Loading States**:
   - Different loading indicators
   - No skeleton loaders

2. **Poor Error Handling**:
   - Generic error messages
   - No retry mechanisms

## Optimization Plan

### 1. Consolidate Order Fetching Hooks

- [ ] **Create a single, optimized hook**:

```typescript
// app/hooks/useOrders.ts (consolidated)
'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { Order, OrdersFilters, PaginationParams } from '@/types/orders'
import { useToast } from '@/components/ui/use-toast'

interface OrdersResponse {
  orders: Order[]
  totalCount: number
  pageCount: number
}

// Generate a stable cache key for SWR
function generateCacheKey(filters?: OrdersFilters, pagination?: PaginationParams) {
  return JSON.stringify({
    endpoint: '/api/orders',
    filters,
    pagination
  })
}

// Fetch orders from the API
async function fetchOrders(
  filters?: OrdersFilters,
  pagination?: PaginationParams
): Promise<OrdersResponse> {
  // Build query string
  const queryParams = new URLSearchParams()
  
  // Add filters
  if (filters?.status?.length) {
    filters.status.forEach(status => {
      queryParams.append('status', status)
    })
  }
  
  if (filters?.paymentStatus?.length) {
    filters.paymentStatus.forEach(status => {
      queryParams.append('paymentStatus', status)
    })
  }
  
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate)
  }
  
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate)
  }
  
  if (filters?.search) {
    queryParams.append('search', filters.search)
  }
  
  if (filters?.clientId) {
    queryParams.append('clientId', filters.clientId)
  }
  
  // Add pagination
  if (pagination) {
    queryParams.append('limit', pagination.pageSize.toString())
    queryParams.append('offset', ((pagination.page - 1) * pagination.pageSize).toString())
  }
  
  // Make the request
  const response = await fetch(`/api/orders?${queryParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  return response.json()
}

/**
 * Hook for fetching orders with filtering and pagination
 */
export function useOrders(
  filters?: OrdersFilters,
  pagination?: PaginationParams = { page: 1, pageSize: 20 }
) {
  const { toast } = useToast()
  
  // Generate a stable cache key
  const cacheKey = useMemo(() => 
    generateCacheKey(filters, pagination), 
    [filters, pagination]
  )
  
  // Use SWR for data fetching
  const { data, error, isLoading, isValidating, mutate } = useSWR<OrdersResponse>(
    cacheKey,
    () => fetchOrders(filters, pagination),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      keepPreviousData: true,
      onError: (err) => {
        console.error('Error fetching orders:', err)
        toast({
          title: 'Error',
          description: 'Failed to fetch orders',
          variant: 'destructive',
        })
      }
    }
  )
  
  return {
    orders: data?.orders || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,
    isLoading,
    isValidating,
    isError: !!error,
    isEmpty: data?.orders?.length === 0,
    mutate,
  }
}

/**
 * Hook for fetching a single order by ID
 */
export function useOrder(id?: string) {
  const { toast } = useToast()
  
  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/orders/${id}` : null,
    async () => {
      if (!id) return null
      
      const response = await fetch(`/api/orders/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }
      
      return response.json()
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // 5 seconds
      onError: (err) => {
        console.error(`Error fetching order ${id}:`, err)
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive',
        })
      }
    }
  )
  
  return {
    order: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}
```

- [ ] **Delete duplicate hooks**:
  - `app/hooks/useSWROrders.ts`
  - `app/hooks/useRealOrders.ts`

### 2. Optimize API Routes

- [ ] **Consolidate API endpoints**:

```typescript
// app/api/orders/route.ts (optimized)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OrderStatus, PaymentStatus } from '@/types/orders'

/**
 * GET /api/orders
 * Retrieves a list of orders with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const status = searchParams.getAll('status') as OrderStatus[]
    const paymentStatus = searchParams.getAll('paymentStatus') as PaymentStatus[]
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const search = searchParams.get('search') || undefined
    const clientId = searchParams.get('clientId') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Start building the query
    let query = supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name)
      `, { count: 'exact' })
    
    // Apply filters
    if (status.length > 0) {
      query = query.in('status', status)
    }
    
    if (paymentStatus.length > 0) {
      query = query.in('payment_status', paymentStatus)
    }
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (search) {
      // Search in order number or client name
      query = query.or(`order_number.ilike.%${search}%,clients.name.ilike.%${search}%`)
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    // Order by created_at descending
    query = query.order('created_at', { ascending: false })
    
    // Execute the query
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }
    
    // Transform the data to include client name
    const transformedOrders = data.map(order => ({
      ...order,
      client_name: order.clients?.name || 'Unknown Client',
      clients: undefined
    }))
    
    // Create response with proper cache headers
    return NextResponse.json(
      {
        orders: transformedOrders,
        totalCount: count || 0,
        pageCount: Math.ceil((count || 0) / limit)
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10'
        }
      }
    )
  } catch (error) {
    console.error('Unexpected error fetching orders:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
```

- [ ] **Optimize single order endpoint**:

```typescript
// app/api/orders/[id]/route.ts (optimized)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/orders/[id]
 * Retrieves a single order with all related details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get order with related data
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }
    
    // Get order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        items:item_id (id, name),
        categories:category_id (id, name)
      `)
      .eq('order_id', id)
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError)
    }
    
    // Get order payments
    const { data: orderPayments, error: orderPaymentsError } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', id)
    
    if (orderPaymentsError) {
      console.error('Error fetching order payments:', orderPaymentsError)
    }
    
    // Get order notes
    const { data: orderNotes, error: orderNotesError } = await supabase
      .from('notes')
      .select('*')
      .eq('linked_item_id', id)
      .eq('linked_item_type', 'order')
    
    if (orderNotesError) {
      console.error('Error fetching order notes:', orderNotesError)
    }
    
    // Format the order to include all related data
    const formattedOrder = {
      ...order,
      client_name: order.clients?.name || 'Unknown Client',
      clients: undefined,
      items: orderItems || [],
      payments: orderPayments || [],
      notes: orderNotes || []
    }
    
    // Return the formatted order
    return NextResponse.json(formattedOrder, {
      headers: {
        'Cache-Control': 'private, max-age=10'
      }
    })
  } catch (error) {
    console.error('Unexpected error fetching order:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
```

### 3. Implement Order Context with SWR

- [ ] **Create an optimized order context**:

```typescript
// app/context/OrdersContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Order, OrdersFilters, PaginationParams } from '@/types/orders'
import { useOrders } from '@/hooks/useOrders'

interface OrdersContextType {
  // State
  orders: Order[]
  totalCount: number
  pageCount: number
  isLoading: boolean
  isValidating: boolean
  isError: boolean
  isEmpty: boolean
  
  // Filters and pagination
  filters: OrdersFilters
  pagination: PaginationParams
  setFilters: (filters: OrdersFilters) => void
  setPagination: (pagination: PaginationParams) => void
  resetFilters: () => void
  
  // Actions
  refreshOrders: () => Promise<void>
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  // State for filters and pagination
  const [filters, setFilters] = useState<OrdersFilters>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 20
  })
  
  // Use the consolidated orders hook
  const {
    orders,
    totalCount,
    pageCount,
    isLoading,
    isValidating,
    isError,
    isEmpty,
    mutate
  } = useOrders(filters, pagination)
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({})
    setPagination({
      page: 1,
      pageSize: 20
    })
  }, [])
  
  // Refresh orders
  const refreshOrders = useCallback(async () => {
    await mutate()
  }, [mutate])
  
  // Update order status with optimistic update
  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      // Optimistically update the UI
      mutate(
        prev => {
          if (!prev) return prev
          
          const updatedOrders = prev.orders.map(order => 
            order.id === orderId ? { ...order, status } : order
          )
          
          return {
            ...prev,
            orders: updatedOrders
          }
        },
        false // Don't revalidate yet
      )
      
      // Make the API request
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update order status')
      }
      
      // Revalidate to ensure data consistency
      await mutate()
      
      return true
    } catch (error) {
      console.error('Error updating order status:', error)
      
      // Revalidate to revert the optimistic update
      await mutate()
      
      return false
    }
  }, [mutate])
  
  return (
    <OrdersContext.Provider value={{
      // State
      orders,
      totalCount,
      pageCount,
      isLoading,
      isValidating,
      isError,
      isEmpty,
      
      // Filters and pagination
      filters,
      pagination,
      setFilters,
      setPagination,
      resetFilters,
      
      // Actions
      refreshOrders,
      updateOrderStatus
    }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrdersContext() {
  const context = useContext(OrdersContext)
  
  if (context === undefined) {
    throw new Error('useOrdersContext must be used within an OrdersProvider')
  }
  
  return context
}
```

### 4. Create Optimized Order Components

- [ ] **Create an optimized orders table component**:

```typescript
// app/components/orders/OrdersTable.tsx
'use client'

import React from 'react'
import { useOrdersContext } from '@/context/OrdersContext'
import { Order } from '@/types/orders'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, MoreHorizontal } from 'lucide-react'

interface OrdersTableProps {
  onViewOrder?: (order: Order) => void
  onEditOrder?: (order: Order) => void
}

export function OrdersTable({ onViewOrder, onEditOrder }: OrdersTableProps) {
  const {
    orders,
    isLoading,
    isEmpty,
    pagination,
    setPagination
  } = useOrdersContext()
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination({
      ...pagination,
      page
    })
  }
  
  // Render loading state
  if (isLoading) {
    return <OrdersTableSkeleton />
  }
  
  // Render empty state
  if (isEmpty) {
    return <OrdersEmptyState />
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewOrder?.(order)}
            >
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{order.client_name}</TableCell>
              <TableCell>{formatDate(order.date)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>{formatCurrency(order.total_amount)}</TableCell>
              <TableCell>{formatCurrency(order.balance)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditOrder?.(order)
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {orders.length} of {pagination.totalCount} orders
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.pageCount}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for the orders table
function OrdersTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 rounded-full ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Empty state for the orders table
function OrdersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
      <h3 className="text-lg font-medium mb-2">No orders found</h3>
      <p className="text-sm text-muted-foreground mb-4">
        There are no orders matching your current filters.
      </p>
      <Button>Create New Order</Button>
    </div>
  )
}

// Status badge component
function OrderStatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
      case 'in_progress':
        return 'bg-blue-500/15 text-blue-600 border-blue-500/30'
      case 'completed':
        return 'bg-green-500/15 text-green-600 border-green-500/30'
      case 'delivered':
        return 'bg-purple-500/15 text-purple-600 border-purple-500/30'
      case 'cancelled':
        return 'bg-red-500/15 text-red-600 border-red-500/30'
      case 'paused':
        return 'bg-gray-500/15 text-gray-600 border-gray-500/30'
      default:
        return 'bg-gray-500/15 text-gray-600 border-gray-500/30'
    }
  }
  
  return (
    <Badge
      variant="outline"
      className={`${getStatusColor(status)} border rounded-md px-2 py-0.5 text-xs font-medium`}
    >
      {status.replace('_', ' ')}
    </Badge>
  )
}
```

### 5. Remove Prefetching Service

- [ ] **Replace prefetching service with SWR's built-in prefetching**:

```typescript
// app/hooks/ui/useRoutePrefetching.ts (optimized)
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { preload } from 'swr'
import { navigationItems } from '@/config/navigation'

/**
 * Hook to prefetch data for routes the user is likely to navigate to
 */
export function useRoutePrefetching() {
  const pathname = usePathname()
  const router = useRouter()
  
  useEffect(() => {
    // Find the current index in the navigation items
    const currentIndex = navigationItems.findIndex(item => item.href === pathname)
    
    if (currentIndex !== -1) {
      // Get the previous and next items
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : null
      const nextIndex = currentIndex < navigationItems.length - 1 ? currentIndex + 1 : null
      
      // Prefetch the previous and next routes
      const prefetchIfValid = (index: number | null) => {
        if (index === null) return
        
        const href = navigationItems[index].href
        
        // Prefetch the route
        router.prefetch(href)
        
        // Prefetch the data for this route
        if (href.includes('/orders')) {
          // Prefetch orders data
          preload('/api/orders', () => 
            fetch('/api/orders?limit=20&offset=0').then(res => res.json())
          )
        } else if (href.includes('/tasks')) {
          // Prefetch tasks data
          preload('/api/tasks', () => 
            fetch('/api/tasks?limit=20&offset=0').then(res => res.json())
          )
        }
      }
      
      // Prefetch previous and next items
      prefetchIfValid(prevIndex)
      prefetchIfValid(nextIndex)
    }
  }, [pathname, router])
}
```

## Implementation Timeline

### Phase 1: Consolidation (Day 1-2)

- Consolidate order fetching hooks
- Optimize API routes
- Remove prefetching service

### Phase 2: Context Implementation (Day 3-4)

- Create the OrdersContext
- Update components to use the context
- Implement optimistic updates

### Phase 3: Component Optimization (Day 5-6)

- Create optimized table components
- Implement proper loading states
- Add error handling

### Phase 4: Testing and Refinement (Day 7-8)

- Test all order fetching scenarios
- Fix any issues
- Optimize performance

## Expected Outcomes

1. **Reduced Code Duplication**: Single source of truth for order fetching
2. **Improved Performance**: Shared cache and optimized data fetching
3. **Better UX**: Consistent loading states and error handling
4. **Maintainability**: Clear separation of concerns and proper documentation
