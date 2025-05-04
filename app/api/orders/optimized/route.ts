import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QueryOptimizer } from '@/lib/query-optimizer';

/**
 * GET /api/orders/optimized
 * Optimized endpoint for fetching orders with better performance
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Number of items per page (default: 20)
 * - status: Filter by status (comma-separated list)
 * - paymentStatus: Filter by payment status (comma-separated list)
 * - startDate: Filter by start date (ISO format)
 * - endDate: Filter by end date (ISO format)
 * - search: Search term for order number, client name, etc.
 * - clientId: Filter by client ID
 * - sort: Field to sort by (default: date)
 * - order: Sort order (asc or desc, default: desc)
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status')?.split(',') || [];
    const paymentStatus = searchParams.get('paymentStatus')?.split(',') || [];
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('clientId') || '';
    const sort = searchParams.get('sort') || 'date';
    const order = searchParams.get('order') || 'desc';

    // Build the query using the optimizer - don't use join to avoid foreign key issues
    // Always enable count to get the total number of records
    const queryOptimizer = new QueryOptimizer('orders')
      .count() // This is critical - it enables the count of ALL matching records, not just the current page
      .paginate(page, pageSize)
      .sort(sort, order as 'asc' | 'desc')
      .timeout(15000); // Set a 15-second timeout for large queries

    // Add a direct count query to verify the total number of records
    const supabase = await createClient();
    if (supabase) {
      try {
        const { count: directCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true }); // head: true means we only want the count, not the data

        console.log('DIRECT COUNT CHECK: Total records in orders table:', directCount);
      } catch (countError) {
        console.error('Error getting direct count:', countError);
      }
    }
    // We'll use client_name directly from orders table instead of joining

    // Initialize the optimizer
    try {
      await queryOptimizer.init();
    } catch (error) {
      console.error('Failed to initialize query optimizer:', error);
      // Return empty results instead of error to avoid UI issues
      return NextResponse.json({
        orders: [],
        totalCount: 0,
        pageCount: 0
      });
    }

    // Apply filters
    if (status.length > 0) {
      queryOptimizer.filter('status', 'in', status);
    }

    if (paymentStatus.length > 0) {
      queryOptimizer.filter('payment_status', 'in', paymentStatus);
    }

    if (startDate) {
      queryOptimizer.filter('date', '>=', startDate);
    }

    if (endDate) {
      queryOptimizer.filter('date', '<=', endDate);
    }

    if (clientId) {
      queryOptimizer.filter('client_id', '=', clientId);
    }

    if (search) {
      try {
        // Search in order number, client name, etc.
        // This is handled differently because we need to use OR conditions
        const supabase = await createClient();
        if (!supabase) {
          throw new Error('Failed to create Supabase client');
        }

        const { data, count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .or(`order_number.ilike.%${search}%,client_name.ilike.%${search}%`)
          .order(sort, { ascending: order === 'asc' })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
          console.error('Error searching orders:', error);
          return NextResponse.json(
            { error: 'Failed to search orders' },
            { status: 500 }
          );
        }

        // If no data, return empty results
        if (!data || data.length === 0) {
          return NextResponse.json({
            orders: [],
            totalCount: 0,
            pageCount: 0
          });
        }

        // Get order IDs for related data
        const orderIds = data.map(order => order.id);

        // Batch fetch related data
        // Only fetch related data if we have order IDs
        let itemsData: any[] = [];
        let notesData: any[] = [];

        if (orderIds.length > 0) {
          try {
            const [itemsResult, notesResult] = await Promise.all([
              supabase
                .from('order_items')
                .select('*')
                .in('order_id', orderIds),
              supabase
                .from('notes')
                .select('*')
                .eq('linked_item_type', 'order')
                .in('linked_item_id', orderIds)
            ]);

            itemsData = itemsResult.data || [];
            notesData = notesResult.data || [];
          } catch (relatedError) {
            console.error('Error fetching related data for search:', relatedError);
            // Continue with empty arrays for related data
          }
        }

        // Process the data
        const transformedOrders = processOrdersData(data, itemsData, notesData);

        // Log the total count for debugging (search case) with more details
        console.log('API orders/optimized (search) - Total count from database:', count, {
          count,
          pageSize,
          pageCount: Math.ceil((count || 0) / pageSize),
          ordersReturned: transformedOrders.length,
          page
        });

        // Handle count properly for search results
        let totalCount = count;

        // Log count details for debugging
        console.log('API: Search count details:', {
          count,
          hasCount: count !== null && count !== undefined,
          dataLength: transformedOrders.length
        });

        // If count is missing, log a warning and use a fallback
        if (count === null || count === undefined) {
          console.warn('API: Count is missing from search results. This may indicate an issue with the query or permissions.');

          // Use a direct count query as a fallback
          try {
            const { count: directCount } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .or(`order_number.ilike.%${search}%,client_name.ilike.%${search}%`);

            if (directCount !== null && directCount !== undefined) {
              console.log('API: Successfully retrieved direct search count:', directCount);
              totalCount = directCount;
            } else {
              console.warn('API: Direct search count query also returned null/undefined. Falling back to data length.');
              totalCount = transformedOrders.length;
            }
          } catch (countError) {
            console.error('API: Error getting direct search count:', countError);
            totalCount = transformedOrders.length;
          }
        }

        // Ensure totalCount is at least the length of the current page data
        if (totalCount < transformedOrders.length) {
          console.warn(`API: Search total count (${totalCount}) is less than the current page data length (${transformedOrders.length}). Adjusting to prevent pagination issues.`);
          totalCount = transformedOrders.length;
        }

        // Make sure we're returning the actual total count, not just the number of records in this page
        return NextResponse.json({
          orders: transformedOrders,
          totalCount: totalCount,
          pageCount: Math.ceil(totalCount / pageSize)
        });
      } catch (searchError) {
        console.error('Error in search functionality:', searchError);
        return NextResponse.json(
          { error: 'An error occurred while searching orders' },
          { status: 500 }
        );
      }
    }

    // Execute the query
    let data, count, error, isTimeout = false;
    try {
      // Log that we're about to execute the query with the current page size
      console.log(`API: Executing orders query with page=${page}, pageSize=${pageSize}`);

      const result = await queryOptimizer.execute();
      data = result.data;
      count = result.count;
      error = result.error;
      isTimeout = result.isTimeout || false;

      if (error) {
        // Check if this is a timeout error
        if (isTimeout) {
          console.error('Timeout error fetching orders - query took too long to complete');

          // For timeout errors, try to get at least some data with a smaller page size
          if (pageSize > 20) {
            console.log('API: Timeout occurred with large page size. Attempting fallback with smaller page size.');

            // Create a new optimizer with a smaller page size
            const fallbackOptimizer = new QueryOptimizer('orders')
              .count()
              .paginate(page, 20) // Use a smaller page size
              .sort(sort, order as 'asc' | 'desc')
              .timeout(10000); // Shorter timeout for fallback

            await fallbackOptimizer.init();

            // Apply the same filters
            if (status.length > 0) {
              fallbackOptimizer.filter('status', 'in', status);
            }
            if (paymentStatus.length > 0) {
              fallbackOptimizer.filter('payment_status', 'in', paymentStatus);
            }
            if (startDate) {
              fallbackOptimizer.filter('date', '>=', startDate);
            }
            if (endDate) {
              fallbackOptimizer.filter('date', '<=', endDate);
            }
            if (clientId) {
              fallbackOptimizer.filter('client_id', '=', clientId);
            }

            // Execute the fallback query
            const fallbackResult = await fallbackOptimizer.execute();

            if (!fallbackResult.error) {
              console.log('API: Fallback query succeeded with smaller page size');
              data = fallbackResult.data;
              count = fallbackResult.count;
              error = null;
            } else {
              console.error('API: Fallback query also failed:', fallbackResult.error);
            }
          }
        } else {
          console.error('Error fetching orders:', error);
        }

        // If we still have an error after fallback attempts
        if (error) {
          // Log detailed error information for debugging
          console.error('Query details:', {
            table: 'orders',
            page,
            pageSize,
            isTimeout,
            filters: {
              status: status.length > 0 ? status : undefined,
              paymentStatus: paymentStatus.length > 0 ? paymentStatus : undefined,
              startDate,
              endDate,
              clientId
            }
          });

          // Return empty results with error information
          // This helps with debugging while still allowing the UI to function
          return NextResponse.json({
            orders: [],
            totalCount: 0,
            pageCount: 0,
            error: {
              message: error.message || 'Failed to fetch orders',
              code: error.code,
              isTimeout,
              details: 'See server logs for more information'
            }
          }, { status: 200 }); // Use 200 status to prevent UI from showing error state
        }
      }

      // Check if data is empty or null
      if (!data || data.length === 0) {
        // Return empty results
        return NextResponse.json({
          orders: [],
          totalCount: 0,
          pageCount: 0
        });
      }
    } catch (queryError) {
      console.error('Error executing query:', queryError);
      // Return empty results instead of error to avoid UI issues
      return NextResponse.json({
        orders: [],
        totalCount: 0,
        pageCount: 0
      });
    }

    // Get order IDs for related data
    const orderIds = (data || []).map(order => order.id);

    // Batch fetch related data
    let itemsData: any[] = [];
    let notesData: any[] = [];

    // Only fetch related data if we have order IDs
    if (orderIds.length > 0) {
      try {
        const supabase = await createClient();
        if (!supabase) {
          throw new Error('Failed to create Supabase client');
        }

        const [itemsResult, notesResult] = await Promise.all([
          supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds),
          supabase
            .from('notes')
            .select('*')
            .eq('linked_item_type', 'order')
            .in('linked_item_id', orderIds)
        ]);

        itemsData = itemsResult.data || [];
        notesData = notesResult.data || [];
      } catch (error) {
        console.error('Error fetching related data:', error);
        // Continue with empty arrays for related data
      }
    }

    // Process the data
    const transformedOrders = processOrdersData(data || [], itemsData, notesData);

    // Log the total count for debugging with more details
    console.log('API orders/optimized - Total count from database:', count, {
      count,
      pageSize,
      pageCount: Math.ceil((count || 0) / pageSize),
      ordersReturned: transformedOrders.length,
      page
    });

    // Handle count properly with enhanced error handling and fallbacks
    let totalCount = count;

    // Log count details for debugging
    console.log('API: Orders count details:', {
      count,
      hasCount: count !== null && count !== undefined,
      dataLength: transformedOrders.length,
      page,
      pageSize,
      filters: {
        status: status.length > 0 ? status : undefined,
        paymentStatus: paymentStatus.length > 0 ? paymentStatus : undefined,
        startDate,
        endDate,
        clientId
      }
    });

    // If count is missing, log a warning and use a fallback
    if (count === null || count === undefined) {
      console.warn('API: Count is missing from Supabase response. This may indicate an issue with the query or permissions.');

      // Use a direct count query as a fallback - with more robust error handling
      try {
        const supabase = await createClient();
        if (supabase) {
          // Build a query that matches the filters used in the main query
          let countQuery = supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

          // Apply the same filters as the main query
          if (status.length > 0) {
            countQuery = countQuery.in('status', status);
          }

          if (paymentStatus.length > 0) {
            countQuery = countQuery.in('payment_status', paymentStatus);
          }

          if (startDate) {
            countQuery = countQuery.gte('date', startDate);
          }

          if (endDate) {
            countQuery = countQuery.lte('date', endDate);
          }

          if (clientId) {
            countQuery = countQuery.eq('client_id', clientId);
          }

          // Execute the count query
          const { count: directCount, error: countQueryError } = await countQuery;

          if (countQueryError) {
            console.error('API: Error in direct count query:', countQueryError);
            totalCount = transformedOrders.length;
          } else if (directCount !== null && directCount !== undefined) {
            console.log('API: Successfully retrieved direct count:', directCount);
            totalCount = directCount;
          } else {
            console.warn('API: Direct count query also returned null/undefined. Falling back to data length.');
            totalCount = transformedOrders.length;
          }
        }
      } catch (countError) {
        console.error('API: Error getting direct count:', countError);
        totalCount = transformedOrders.length;
      }
    }

    // Ensure totalCount is at least the length of the current page data
    // This prevents pagination issues where totalCount is less than the visible data
    if (totalCount < transformedOrders.length) {
      console.warn(`API: Total count (${totalCount}) is less than the current page data length (${transformedOrders.length}). Adjusting to prevent pagination issues.`);
      totalCount = transformedOrders.length;
    }

    // Calculate the expected number of pages
    const expectedPageCount = Math.ceil(totalCount / pageSize);

    // Log detailed pagination information
    console.log('API: Pagination details:', {
      totalCount,
      pageSize,
      currentPage: page,
      expectedPageCount,
      recordsOnCurrentPage: transformedOrders.length,
      hasMorePages: expectedPageCount > page
    });

    // Make sure we're returning the actual total count, not just the number of records in this page
    return NextResponse.json({
      orders: transformedOrders,
      totalCount: totalCount,
      pageCount: Math.ceil(totalCount / pageSize)
    });
  } catch (error) {
    console.error('Unexpected error in optimized orders API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Process orders data with related items and notes
 */
function processOrdersData(orders: any[], items: any[] = [], notes: any[] = []) {
  // Group items and notes by order_id for quick lookup
  const itemsByOrderId = new Map();
  items.forEach(item => {
    if (!itemsByOrderId.has(item.order_id)) {
      itemsByOrderId.set(item.order_id, []);
    }
    itemsByOrderId.get(item.order_id).push(item);
  });

  const notesByOrderId = new Map();
  notes.forEach(note => {
    if (!notesByOrderId.has(note.linked_item_id)) {
      notesByOrderId.set(note.linked_item_id, []);
    }
    notesByOrderId.get(note.linked_item_id).push(note);
  });

  // Map the orders with their related data
  return (orders || []).map(order => ({
    id: order.id,
    order_number: order.order_number,
    client_id: order.client_id,
    // Use the client_name directly from the order
    client_name: order.client_name || 'Unknown Client',
    client_type: order.client_type || 'regular',
    date: order.date,
    delivery_date: order.delivery_date,
    is_delivered: order.is_delivered || false,
    status: order.status,
    payment_status: order.payment_status,
    total_amount: order.total_amount || 0,
    amount_paid: order.amount_paid || 0,
    balance: order.balance || 0,
    created_by: order.created_by,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: itemsByOrderId.get(order.id) || [],
    notes: notesByOrderId.get(order.id) || []
  }));
}
