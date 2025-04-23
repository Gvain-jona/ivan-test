'use client';

import { format } from 'date-fns';
import { Order, OrderItem } from '@/types/orders';
import { InvoiceSettings } from '../types';

/**
 * Format a date string to a human-readable format
 * 
 * @param dateString The date string to format
 * @param formatString The format string to use
 * @returns The formatted date string
 */
export function formatDate(dateString: string, formatString: string = 'dd/MM/yyyy'): string {
  try {
    const date = new Date(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a currency value to a human-readable format
 * 
 * @param value The value to format
 * @param currency The currency code
 * @returns The formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'UGX'): string {
  try {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${value}`;
  }
}

/**
 * Format an item name based on the invoice settings
 * 
 * @param item The order item
 * @param settings The invoice settings
 * @returns The formatted item name
 */
export function formatItemName(item: OrderItem, settings: InvoiceSettings): string {
  const { showItemCategory, showItemName, showItemSize, itemDisplayFormat } = settings;
  
  if (itemDisplayFormat === 'combined') {
    const parts = [];
    
    if (showItemCategory && item.category_name) {
      parts.push(item.category_name);
    }
    
    if (showItemName && item.item_name) {
      parts.push(item.item_name);
    }
    
    if (showItemSize && item.size) {
      parts.push(`(${item.size})`);
    }
    
    return parts.join(' - ');
  } else {
    // For separate format, just return the item name
    return item.item_name || '';
  }
}

/**
 * Calculate the subtotal for an order
 * 
 * @param order The order
 * @returns The subtotal
 */
export function calculateSubtotal(order: Order): number {
  return order.total_amount || 0;
}

/**
 * Calculate the tax amount for an order
 * 
 * @param order The order
 * @param settings The invoice settings
 * @returns The tax amount
 */
export function calculateTax(order: Order, settings: InvoiceSettings): number {
  if (!settings.includeTax) return 0;
  
  const subtotal = calculateSubtotal(order);
  return subtotal * (settings.taxRate / 100);
}

/**
 * Calculate the discount amount for an order
 * 
 * @param order The order
 * @param settings The invoice settings
 * @returns The discount amount
 */
export function calculateDiscount(order: Order, settings: InvoiceSettings): number {
  if (!settings.includeDiscount) return 0;
  
  const subtotal = calculateSubtotal(order);
  return subtotal * (settings.discountRate / 100);
}

/**
 * Calculate the total amount for an order
 * 
 * @param order The order
 * @param settings The invoice settings
 * @returns The total amount
 */
export function calculateTotal(order: Order, settings: InvoiceSettings): number {
  const subtotal = calculateSubtotal(order);
  const tax = calculateTax(order, settings);
  const discount = calculateDiscount(order, settings);
  
  return subtotal + tax - discount;
}

/**
 * Format an invoice filename
 * 
 * @param order The order
 * @returns The formatted filename
 */
export function formatInvoiceFilename(order: Order): string {
  // Use order number if available, otherwise use a portion of the ID
  const orderIdentifier = order.order_number || (order.id ? order.id.substring(0, 8) : 'unknown');
  
  // Format the client name for the filename (remove special characters)
  const clientName = order.client_name
    ? order.client_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
    : 'Client';
  
  // Add date to filename
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return `Invoice_${orderIdentifier}_${clientName}_${date}.pdf`;
}
