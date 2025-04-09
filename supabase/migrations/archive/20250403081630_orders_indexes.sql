-- Additional indexes for Orders in Ivan Prints Business Management System
-- Purpose: Optimize query performance for order-related operations
-- Created: 2025-04-03

-- Add indexes to orders table
CREATE INDEX IF NOT EXISTS orders_date_idx ON orders(date);
CREATE INDEX IF NOT EXISTS orders_created_by_idx ON orders(created_by);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);

-- Add indexes to order_items table
CREATE INDEX IF NOT EXISTS order_items_item_id_idx ON order_items(item_id);
CREATE INDEX IF NOT EXISTS order_items_category_id_idx ON order_items(category_id);

-- Add indexes to order_payments table
CREATE INDEX IF NOT EXISTS order_payments_payment_date_idx ON order_payments(payment_date);
CREATE INDEX IF NOT EXISTS order_payments_payment_type_idx ON order_payments(payment_type);

-- Add indexes to notes table for orders
CREATE INDEX IF NOT EXISTS notes_order_idx ON notes(linked_item_id) 
  WHERE linked_item_type = 'order';

-- Add compound indexes for more complex queries
CREATE INDEX IF NOT EXISTS orders_status_date_idx ON orders(status, date);
CREATE INDEX IF NOT EXISTS orders_payment_status_date_idx ON orders(payment_status, date);

-- Add GIST index for text search on client names through the relationship
CREATE INDEX IF NOT EXISTS orders_client_id_status_idx ON orders(client_id, status);

-- Add index for recently created orders (commonly accessed)
CREATE INDEX IF NOT EXISTS orders_recent_idx ON orders(created_at DESC);

-- Comment on the purpose of each index
COMMENT ON INDEX orders_date_idx IS 'Improves performance of date-range queries on orders';
COMMENT ON INDEX orders_created_by_idx IS 'Improves performance when filtering orders by creator';
COMMENT ON INDEX orders_created_at_idx IS 'Improves performance of sorting by creation date';
COMMENT ON INDEX order_items_item_id_idx IS 'Improves joins between items and order_items';
COMMENT ON INDEX order_items_category_id_idx IS 'Improves category-based filtering of order items';
COMMENT ON INDEX order_payments_payment_date_idx IS 'Improves date-range queries on payments';
COMMENT ON INDEX order_payments_payment_type_idx IS 'Improves filtering payments by type';
COMMENT ON INDEX notes_order_idx IS 'Improves retrieval of notes for a specific order';
COMMENT ON INDEX orders_status_date_idx IS 'Improves filtering of orders by status and date range';
COMMENT ON INDEX orders_payment_status_date_idx IS 'Improves filtering by payment status and date range';
COMMENT ON INDEX orders_client_id_status_idx IS 'Improves performance when filtering a client''s orders by status';
COMMENT ON INDEX orders_recent_idx IS 'Improves performance when retrieving most recent orders'; 