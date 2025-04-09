/**
 * Database Service Layer
 *
 * This file provides a service layer for database operations using Supabase.
 * It includes common CRUD operations, error handling, and connection pooling.
 */

import { createClient } from '../supabase/client';
import { createServerClient } from '../supabase/server';
import { cookies } from 'next/headers';

// Error handling
export class DatabaseError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Create a database client based on the context (server or client)
 *
 * @param serverSide - Whether to create a server-side client
 * @returns A Supabase client instance
 */
export function getDbClient(serverSide = false) {
  if (serverSide) {
    const cookieStore = cookies();
    return createServerClient(cookieStore);
  }

  return createClient();
}

// Generic types for database operations
type TableName =
  | 'profiles'
  | 'clients'
  | 'categories'
  | 'items'
  | 'orders'
  | 'order_items'
  | 'order_payments'
  | 'suppliers'
  | 'expenses'
  | 'expense_payments'
  | 'material_purchases'
  | 'material_purchase_payments'
  | 'tasks'
  | 'notes'
  | 'notifications'
  | 'settings'
  | 'approvals'
  | 'sessions';

type OrderDirection = 'asc' | 'desc';

type PaginationParams = {
  page: number;
  pageSize: number;
};

type FilterOptions = {
  [key: string]: any;
};

type SelectOptions = {
  columns?: string;
  count?: 'exact' | 'planned' | 'estimated';
};

// Generic paginated response
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageCount: number;
}

/**
 * Database service for common CRUD operations
 */
export const db = {
  /**
   * Generic query function to fetch records from a table
   *
   * @param table - The table name
   * @param filters - Filter options for the query
   * @param pagination - Pagination parameters
   * @param orderBy - Order by column
   * @param direction - Order direction
   * @param options - Additional options
   * @param serverSide - Whether to use server-side client
   * @returns A paginated response
   */
  async query<T>(
    table: TableName,
    filters: FilterOptions = {},
    pagination: PaginationParams = { page: 1, pageSize: 10 },
    orderBy: string = 'created_at',
    direction: OrderDirection = 'desc',
    options: SelectOptions = { count: 'exact' },
    serverSide = false
  ): Promise<PaginatedResponse<T>> {
    try {
      const supabase = getDbClient(serverSide);

      // Start the query
      let query = supabase
        .from(table)
        .select(options.columns || '*', { count: options.count });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle IN operator for arrays
          query = query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle special operators like gt, lt, gte, lte
          const operator = Object.keys(value)[0];
          const operatorValue = value[operator];

          switch (operator) {
            case 'gt':
              query = query.gt(key, operatorValue);
              break;
            case 'lt':
              query = query.lt(key, operatorValue);
              break;
            case 'gte':
              query = query.gte(key, operatorValue);
              break;
            case 'lte':
              query = query.lte(key, operatorValue);
              break;
            case 'like':
              query = query.ilike(key, `%${operatorValue}%`);
              break;
            default:
              // Ignore unknown operators
              break;
          }
        } else {
          // Handle equality
          query = query.eq(key, value);
        }
      });

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      // Execute the query
      const { data, count, error } = await query
        .order(orderBy, { ascending: direction === 'asc' })
        .range(from, to);

      if (error) {
        throw new DatabaseError(error.message, error.code === '42P01' ? 404 : 500, error.code);
      }

      const totalCount = count || 0;
      const pageCount = Math.ceil(totalCount / pagination.pageSize);

      return { data: data as T[], totalCount, pageCount };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Unknown database error',
        500
      );
    }
  },

  /**
   * Get a record by ID
   *
   * @param table - The table name
   * @param id - The record ID
   * @param options - Additional options
   * @param serverSide - Whether to use server-side client
   * @returns The record
   */
  async getById<T>(
    table: TableName,
    id: string,
    options: { columns?: string } = {},
    serverSide = false
  ): Promise<T> {
    try {
      const supabase = getDbClient(serverSide);

      const { data, error } = await supabase
        .from(table)
        .select(options.columns || '*')
        .eq('id', id)
        .single();

      if (error) {
        throw new DatabaseError(
          error.code === 'PGRST116' ? `${table} record not found` : error.message,
          error.code === 'PGRST116' ? 404 : 500,
          error.code
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : `Failed to fetch ${table} record`,
        500
      );
    }
  },

  /**
   * Create a new record
   *
   * @param table - The table name
   * @param data - The data to insert
   * @param serverSide - Whether to use server-side client
   * @returns The created record
   */
  async create<T>(
    table: TableName,
    data: Record<string, any>,
    serverSide = false
  ): Promise<T> {
    try {
      const supabase = getDbClient(serverSide);

      const { data: record, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }

      return record as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : `Failed to create ${table} record`,
        500
      );
    }
  },

  /**
   * Update a record
   *
   * @param table - The table name
   * @param id - The record ID
   * @param data - The data to update
   * @param serverSide - Whether to use server-side client
   * @returns The updated record
   */
  async update<T>(
    table: TableName,
    id: string,
    data: Record<string, any>,
    serverSide = false
  ): Promise<T> {
    try {
      const supabase = getDbClient(serverSide);

      const { data: record, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }

      return record as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : `Failed to update ${table} record`,
        500
      );
    }
  },

  /**
   * Delete a record
   *
   * @param table - The table name
   * @param id - The record ID
   * @param serverSide - Whether to use server-side client
   */
  async delete(
    table: TableName,
    id: string,
    serverSide = false
  ): Promise<void> {
    try {
      const supabase = getDbClient(serverSide);

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : `Failed to delete ${table} record`,
        500
      );
    }
  },

  /**
   * Execute a raw query (use with caution)
   *
   * @param query - The SQL query
   * @param params - Query parameters
   * @param serverSide - Whether to use server-side client
   * @returns The query result
   */
  async raw<T>(
    query: string,
    params: any[] = [],
    serverSide = false
  ): Promise<T[]> {
    try {
      const supabase = getDbClient(serverSide);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: query,
        params
      });

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }

      return data as T[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to execute query',
        500
      );
    }
  },

  /**
   * Begin a database transaction
   *
   * @param serverSide - Whether to use server-side client
   * @returns The transaction ID
   */
  async beginTransaction(serverSide = false): Promise<string> {
    try {
      const supabase = getDbClient(serverSide);

      const { data, error } = await supabase.rpc('begin_transaction');

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }

      return data as string;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to begin transaction',
        500
      );
    }
  },

  /**
   * Commit a database transaction
   *
   * @param serverSide - Whether to use server-side client
   */
  async commitTransaction(serverSide = false): Promise<void> {
    try {
      const supabase = getDbClient(serverSide);

      const { error } = await supabase.rpc('commit_transaction');

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to commit transaction',
        500
      );
    }
  },

  /**
   * Rollback a database transaction
   *
   * @param serverSide - Whether to use server-side client
   */
  async rollbackTransaction(serverSide = false): Promise<void> {
    try {
      const supabase = getDbClient(serverSide);

      const { error } = await supabase.rpc('rollback_transaction');

      if (error) {
        throw new DatabaseError(error.message, 500, error.code);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to rollback transaction',
        500
      );
    }
  },

  /**
   * Execute a Remote Procedure Call (RPC) function
   *
   * @param funcName - The name of the RPC function to call
   * @param params - Parameters to pass to the function
   * @param serverSide - Whether to use server-side client
   * @returns The result of the RPC function
   */
  async executeRpc(
    funcName: string,
    params: Record<string, any> = {},
    serverSide = false
  ): Promise<any> {
    try {
      const supabase = getDbClient(serverSide);

      const { data, error } = await supabase
        .rpc(funcName, params);

      if (error) {
        throw new DatabaseError(
          error.message,
          error.code === 'PGRST116' ? 404 : 500,
          error.code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        error instanceof Error ? error.message : `Failed to execute RPC function: ${funcName}`,
        500
      );
    }
  }
};

// Specialized services for each entity type
export const ordersService = {
  async getAll(
    filters: FilterOptions = {},
    pagination: PaginationParams = { page: 1, pageSize: 10 },
    serverSide = false
  ) {
    return db.query<z.Order>(
      'orders',
      filters,
      pagination,
      'created_at',
      'desc',
      { columns: '*, clients:client_id(name)', count: 'exact' },
      serverSide
    );
  },

  async getById(id: string, serverSide = false) {
    const order = await db.getById<z.Order>(
      'orders',
      id,
      { columns: '*, clients:client_id(name)' },
      serverSide
    );

    // Format the order to handle joined data
    const formattedOrder: z.Order = {
      ...order,
      client_name: (order as any).clients?.name || 'Unknown Client',
      clients: undefined
    };

    // Fetch order items
    const { data: items } = await db.query<z.OrderItem>(
      'order_items',
      { order_id: id },
      { page: 1, pageSize: 100 },
      'created_at',
      'asc',
      { columns: '*, items:item_id(name), categories:category_id(name)' },
      serverSide
    );

    // Format items to handle joined data
    formattedOrder.items = items.map((item): z.OrderItem => ({
      ...item,
      item_name: (item as any).items?.name || 'Unknown Item',
      category_name: (item as any).categories?.name || 'Unknown Category',
      items: undefined,
      categories: undefined
    }));

    // Fetch order payments
    const { data: payments } = await db.query<z.OrderPayment>(
      'order_payments',
      { order_id: id },
      { page: 1, pageSize: 100 },
      'payment_date',
      'desc',
      {},
      serverSide
    );

    formattedOrder.payments = payments;

    // Fetch order notes
    const { data: notes } = await db.query<z.Note>(
      'notes',
      { linked_item_id: id, linked_item_type: 'order' },
      { page: 1, pageSize: 100 },
      'created_at',
      'desc',
      {},
      serverSide
    );

    formattedOrder.notes = notes;

    return formattedOrder;
  },

  async create(order: Omit<z.Order, 'id' | 'created_at' | 'updated_at'>, serverSide = false) {
    try {
      // Validate the order data
      z.validateOrder(order);

      // Begin a transaction
      await db.beginTransaction(serverSide);

      // Create the order
      const newOrder = await db.create<z.Order>('orders', order, serverSide);

      // Create order items if provided
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await db.create<z.OrderItem>(
            'order_items',
            {
              ...item,
              order_id: newOrder.id
            },
            serverSide
          );
        }
      }

      // Create order payments if provided
      if (order.payments && order.payments.length > 0) {
        for (const payment of order.payments) {
          await db.create<z.OrderPayment>(
            'order_payments',
            {
              ...payment,
              order_id: newOrder.id
            },
            serverSide
          );
        }
      }

      // Commit the transaction
      await db.commitTransaction(serverSide);

      // Return the created order with all related data
      return ordersService.getById(newOrder.id, serverSide);
    } catch (error) {
      // Rollback the transaction on error
      await db.rollbackTransaction(serverSide);
      throw error;
    }
  },

  async update(
    id: string,
    orderData: Partial<z.Order>,
    serverSide = false
  ) {
    try {
      // Validate the order data
      z.validateOrderUpdate(orderData);

      // Begin a transaction
      await db.beginTransaction(serverSide);

      // Update the order
      await db.update<z.Order>('orders', id, orderData, serverSide);

      // Update order items if provided
      if (orderData.items && orderData.items.length > 0) {
        // Delete existing items first
        const supabase = getDbClient(serverSide);
        await supabase.from('order_items').delete().eq('order_id', id);

        // Create new items
        for (const item of orderData.items) {
          await db.create<z.OrderItem>(
            'order_items',
            {
              ...item,
              order_id: id
            },
            serverSide
          );
        }
      }

      // Update order payments if provided
      if (orderData.payments && orderData.payments.length > 0) {
        for (const payment of orderData.payments) {
          if (payment.id) {
            // Update existing payment
            await db.update<z.OrderPayment>(
              'order_payments',
              payment.id,
              payment,
              serverSide
            );
          } else {
            // Create new payment
            await db.create<z.OrderPayment>(
              'order_payments',
              {
                ...payment,
                order_id: id
              },
              serverSide
            );
          }
        }
      }

      // Commit the transaction
      await db.commitTransaction(serverSide);

      // Return the updated order with all related data
      return ordersService.getById(id, serverSide);
    } catch (error) {
      // Rollback the transaction on error
      await db.rollbackTransaction(serverSide);
      throw error;
    }
  },

  async delete(id: string, serverSide = false) {
    await db.delete('orders', id, serverSide);
  }
};

// Export other entity services
export const tasksService = {
  // Similar implementation as ordersService
  async getAll(
    filters: FilterOptions = {},
    pagination: PaginationParams = { page: 1, pageSize: 10 },
    serverSide = false
  ) {
    return db.query<z.Task>(
      'tasks',
      filters,
      pagination,
      'due_date',
      'asc',
      { columns: '*, users:assigned_to(name)', count: 'exact' },
      serverSide
    );
  },

  async getById(id: string, serverSide = false) {
    const task = await db.getById<z.Task>(
      'tasks',
      id,
      { columns: '*, assigned_user:assigned_to(name), creator:created_by(name)' },
      serverSide
    );

    return {
      ...task,
      assigned_user_name: (task as any).assigned_user?.name,
      created_by_name: (task as any).creator?.name,
      assigned_user: undefined,
      creator: undefined
    };
  },

  async create(task: Omit<z.Task, 'id' | 'created_at' | 'updated_at'>, serverSide = false) {
    // Validate the task data
    z.validateTask(task);

    // Create the task
    return db.create<z.Task>('tasks', task, serverSide);
  },

  async update(id: string, task: Partial<z.Task>, serverSide = false) {
    // Validate the task data
    z.validateTaskUpdate(task);

    // Update the task
    return db.update<z.Task>('tasks', id, task, serverSide);
  },

  async delete(id: string, serverSide = false) {
    await db.delete('tasks', id, serverSide);
  }
};

// Additional entity services can be implemented following the same pattern