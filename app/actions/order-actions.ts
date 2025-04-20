"use server"

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { OrderItem, OrderNote } from '@/types/orders';

// Create a Supabase client
const getSupabase = async () => {
  // Use await with cookies() as it's now async in Next.js 15
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
};

/**
 * Find or create a category by name
 */
export async function findOrCreateCategory(name: string) {
  const supabase = await getSupabase();

  // Trim and validate the name
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  // First, try to find an existing category with this name
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', trimmedName)
    .limit(1)
    .single();

  if (existingCategory) {
    return existingCategory;
  }

  // If not found, create a new category
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({ name: trimmedName })
    .select('id, name')
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return newCategory;
}

/**
 * Find or create an item by name and category
 */
export async function findOrCreateItem(name: string, categoryId: string) {
  const supabase = await getSupabase();

  // Trim and validate the name
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  // First, try to find an existing item with this name and category
  const { data: existingItem } = await supabase
    .from('items')
    .select('id, name')
    .ilike('name', trimmedName)
    .eq('category_id', categoryId)
    .limit(1)
    .single();

  if (existingItem) {
    return existingItem;
  }

  // If not found, create a new item
  const { data: newItem, error } = await supabase
    .from('items')
    .insert({
      name: trimmedName,
      category_id: categoryId
    })
    .select('id, name')
    .single();

  if (error) {
    console.error('Error creating item:', error);
    return null;
  }

  return newItem;
}

/**
 * Find or create a size by name
 */
export async function findOrCreateSize(name: string) {
  const supabase = await getSupabase();

  // Trim and validate the name
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  // First, try to find an existing size with this name
  const { data: existingSize } = await supabase
    .from('sizes')
    .select('id, name')
    .ilike('name', trimmedName)
    .limit(1)
    .single();

  if (existingSize) {
    return existingSize;
  }

  // If not found, create a new size
  const { data: newSize, error } = await supabase
    .from('sizes')
    .insert({ name: trimmedName })
    .select('id, name')
    .single();

  if (error) {
    console.error('Error creating size:', error);
    return null;
  }

  return newSize;
}

/**
 * Find or create a client by name
 */
export async function findOrCreateClient(name: string) {
  const supabase = await getSupabase();

  // Trim and validate the name
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  // First, try to find an existing client with this name
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id, name')
    .ilike('name', trimmedName)
    .limit(1)
    .single();

  if (existingClient) {
    return existingClient;
  }

  // If not found, create a new client
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({ name: trimmedName })
    .select('id, name')
    .single();

  if (error) {
    console.error('Error creating client:', error);
    return null;
  }

  return newClient;
}

/**
 * Process order item with text inputs instead of IDs
 */
export async function processOrderItem(orderItem: OrderItem & { category_name: string, item_name: string }) {
  // Find or create category
  const category = await findOrCreateCategory(orderItem.category_name);
  if (!category) {
    throw new Error(`Failed to find or create category: ${orderItem.category_name}`);
  }

  // Find or create item
  const item = await findOrCreateItem(orderItem.item_name, category.id);
  if (!item) {
    throw new Error(`Failed to find or create item: ${orderItem.item_name}`);
  }

  // Return the processed item with IDs
  return {
    ...orderItem,
    category_id: category.id,
    item_id: item.id
  };
}

/**
 * Process order with text inputs instead of IDs
 */
export async function processOrder(order: any) {
  // Find or create client if client_name is provided
  if (order.client_name) {
    const client = await findOrCreateClient(order.client_name);
    if (client) {
      order.client_id = client.id;
    }
  }

  // Process order items if any
  if (order.items && Array.isArray(order.items)) {
    const processedItems = [];

    for (const item of order.items) {
      try {
        const processedItem = await processOrderItem(item);
        processedItems.push(processedItem);
      } catch (error) {
        console.error('Error processing order item:', error);
      }
    }

    order.items = processedItems;
  }

  return order;
}
