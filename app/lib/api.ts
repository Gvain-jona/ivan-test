import { createClient } from './supabase/client';
import { 
  Order, 
  Task, 
  OrdersTableFilters, 
  TasksFilters,
  PaginationParams,
  OrdersResponse,
  TasksResponse,
  Client,
  Category,
  Item,
  OrderPayment,
  OrderNote,
  OrderItem
} from '@/types/orders';

// API Error class for consistent error handling
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch orders with filtering and pagination
 */
export async function fetchOrders(
  filters: OrdersTableFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<OrdersResponse> {
  try {
    const supabase = createClient();
    
    // Start the query
    let query = supabase
      .from('orders')
      .select('*, clients:client_id(name)', { count: 'exact' });
    
    // Apply filters
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    
    if (filters.client) {
      query = query.eq('client_id', filters.client);
    }
    
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters.paymentStatus && filters.paymentStatus.length > 0) {
      query = query.in('payment_status', filters.paymentStatus);
    }
    
    if (filters.search) {
      // Search in order ID or client name (through a join)
      query = query.or(`id.ilike.%${filters.search}%, clients.name.ilike.%${filters.search}%`);
    }
    
    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    
    // Execute the query
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      throw new ApiError(error.message, error.code === '42P01' ? 404 : 500);
    }
    
    // Map the results to properly handle joined data
    const orders = data.map((order: any): Order => ({
      ...order,
      client_name: order.clients?.name || 'Unknown Client',
      // Remove the clients object to avoid confusion
      clients: undefined
    }));
    
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pagination.pageSize);
    
    return { orders, totalCount, pageCount };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch orders');
  }
}

/**
 * Fetch a single order by ID with all related data
 */
export async function fetchOrderById(orderId: string): Promise<Order> {
  try {
    const supabase = createClient();
    
    // Fetch the order with the client name
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, clients:client_id(name)')
      .eq('id', orderId)
      .single();
    
    if (error) {
      throw new ApiError(
        error.code === 'PGRST116' ? 'Order not found' : error.message,
        error.code === 'PGRST116' ? 404 : 500
      );
    }
    
    // Format the order to handle joined data
    const formattedOrder: Order = {
      ...order,
      client_name: order.clients?.name || 'Unknown Client',
      clients: undefined
    };
    
    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, items:item_id(name), categories:category_id(name)')
      .eq('order_id', orderId);
    
    if (itemsError) {
      throw new ApiError(itemsError.message, 500);
    }
    
    // Format items to handle joined data
    formattedOrder.items = items.map((item): OrderItem => ({
      ...item,
      item_name: item.items?.name || 'Unknown Item',
      category_name: item.categories?.name || 'Unknown Category',
      items: undefined,
      categories: undefined
    }));
    
    // Fetch order payments
    const { data: payments, error: paymentsError } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', orderId);
    
    if (paymentsError) {
      throw new ApiError(paymentsError.message, 500);
    }
    
    formattedOrder.payments = payments;
    
    // Fetch order notes
    const { data: notes, error: notesError } = await supabase
      .from('order_notes')
      .select('*')
      .eq('linked_item_id', orderId)
      .eq('linked_item_type', 'order');
    
    if (notesError) {
      throw new ApiError(notesError.message, 500);
    }
    
    formattedOrder.notes = notes;
    
    return formattedOrder;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch order');
  }
}

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  try {
    const supabase = createClient();
    
    // Insert the order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        client_id: order.client_id,
        date: order.date,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        amount_paid: order.amount_paid,
        balance: order.balance,
        created_by: order.created_by
      })
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create order');
  }
}

/**
 * Update an existing order
 */
export async function updateOrder(id: string, order: Partial<Order>): Promise<Order> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .update({
        client_id: order.client_id,
        date: order.date,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        amount_paid: order.amount_paid,
        balance: order.balance
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to update order');
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(id: string): Promise<void> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete order');
  }
}

/**
 * Fetch tasks with filtering and pagination
 */
export async function fetchTasks(
  filters: TasksFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<TasksResponse> {
  try {
    const supabase = createClient();
    
    // Start the query
    let query = supabase
      .from('tasks')
      .select('*, users:assigned_to(name)', { count: 'exact' });
    
    // Apply filters
    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }
    
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters.dueDate?.start) {
      query = query.gte('due_date', filters.dueDate.start);
    }
    
    if (filters.dueDate?.end) {
      query = query.lte('due_date', filters.dueDate.end);
    }
    
    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    
    // Execute the query
    const { data, count, error } = await query
      .order('due_date', { ascending: true })
      .range(from, to);
    
    if (error) {
      throw new ApiError(error.message, error.code === '42P01' ? 404 : 500);
    }
    
    // Map the results to properly handle joined data
    const tasks = data.map((task: any): Task => ({
      ...task,
      assigned_to_name: task.users?.name || 'Unassigned',
      users: undefined
    }));
    
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pagination.pageSize);
    
    return { tasks, totalCount, pageCount };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch tasks');
  }
}

/**
 * Fetch a single task by ID
 */
export async function fetchTaskById(taskId: string): Promise<Task> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*, users:assigned_to(name)')
      .eq('id', taskId)
      .single();
    
    if (error) {
      throw new ApiError(
        error.code === 'PGRST116' ? 'Task not found' : error.message,
        error.code === 'PGRST116' ? 404 : 500
      );
    }
    
    // Format the task to handle joined data
    const formattedTask: Task = {
      ...data,
      assigned_to_name: data.users?.name || 'Unassigned',
      users: undefined
    };
    
    return formattedTask;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch task');
  }
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        linked_item_type: task.linked_item_type,
        linked_item_id: task.linked_item_id,
        recurring: task.recurring,
        recurrence_frequency: task.recurrence_frequency,
        recurrence_end_date: task.recurrence_end_date,
        assigned_to: task.assigned_to,
        created_by: task.created_by
      })
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to create task');
  }
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, task: Partial<Task>): Promise<Task> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        linked_item_type: task.linked_item_type,
        linked_item_id: task.linked_item_id,
        recurring: task.recurring,
        recurrence_frequency: task.recurrence_frequency,
        recurrence_end_date: task.recurrence_end_date,
        assigned_to: task.assigned_to
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to update task');
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete task');
  }
}

/**
 * Mark a task as complete
 */
export async function completeTask(id: string): Promise<Task> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to complete task');
  }
}

/**
 * Fetch clients for dropdown
 */
export async function fetchClients(): Promise<Client[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch clients');
  }
}

/**
 * Fetch categories for dropdown
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch categories');
  }
}

/**
 * Fetch items by category for dropdown
 */
export async function fetchItemsByCategory(categoryId: string): Promise<Item[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch items');
  }
}

/**
 * Add a payment to an order
 */
export async function addPayment(payment: Omit<OrderPayment, 'id' | 'created_at' | 'updated_at'>): Promise<OrderPayment> {
  try {
    const supabase = createClient();
    
    // Insert the payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('order_payments')
      .insert({
        order_id: payment.order_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_type: payment.payment_type
      })
      .select()
      .single();
    
    if (paymentError) {
      throw new ApiError(paymentError.message, 500);
    }
    
    // Fetch the order to get current payment totals
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('amount_paid, total_amount')
      .eq('id', payment.order_id)
      .single();
    
    if (orderError) {
      throw new ApiError(orderError.message, 500);
    }
    
    // Update the order with new amount paid and balance
    const newAmountPaid = (order.amount_paid || 0) + payment.amount;
    const newBalance = (order.total_amount || 0) - newAmountPaid;
    const newPaymentStatus = newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partially_paid' : 'unpaid';
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        amount_paid: newAmountPaid,
        balance: newBalance,
        payment_status: newPaymentStatus
      })
      .eq('id', payment.order_id);
    
    if (updateError) {
      throw new ApiError(updateError.message, 500);
    }
    
    return paymentData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to add payment');
  }
}

/**
 * Add a note to an order
 */
export async function addNote(note: Omit<OrderNote, 'id' | 'created_at' | 'updated_at'>): Promise<OrderNote> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('order_notes')
      .insert({
        type: note.type,
        text: note.text,
        linked_item_type: note.linked_item_type,
        linked_item_id: note.linked_item_id,
        created_by: note.created_by
      })
      .select()
      .single();
    
    if (error) {
      throw new ApiError(error.message, 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to add note');
  }
}

/**
 * Generate an invoice for an order
 * This is a placeholder function that would normally call a real API endpoint
 */
export async function generateInvoice(orderId: string): Promise<string> {
  // In a real application, this would call an API to generate a PDF invoice
  // For now, we'll just return a mock URL after a short delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock URL for the generated invoice
  return `https://example.com/api/invoices/${orderId}.pdf`;
} 