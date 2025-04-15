# Invoice System Improvements

This document outlines the improvements made to the invoice system in the Ivan Prints Business Management System.

## Database Structure

### New Invoices Table

We've added a dedicated `invoices` table to track invoice metadata:

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_proforma BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Order Table Updates

We've added fields to the `orders` table to track invoice generation:

```sql
ALTER TABLE orders ADD COLUMN latest_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN invoice_generated_at TIMESTAMP WITH TIME ZONE;
```

### Automatic Invoice Numbering

We've implemented a function to generate sequential invoice numbers in the format `INV-YYYY-NNNN`:

```sql
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_number INTEGER;
    new_invoice_number TEXT;
BEGIN
    -- Get current year
    year_part := to_char(CURRENT_DATE, 'YYYY');
    
    -- Get the latest sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0)
    INTO sequence_number
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    
    -- Increment the sequence number
    sequence_number := sequence_number + 1;
    
    -- Format the new invoice number
    new_invoice_number := 'INV-' || year_part || '-' || LPAD(sequence_number::TEXT, 4, '0');
    
    -- Set the invoice number
    NEW.invoice_number := new_invoice_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## API Endpoints

We've added dedicated API endpoints for invoice operations:

1. **GET /api/invoices** - Retrieves a list of invoices with optional filtering and pagination
2. **GET /api/invoices/[id]** - Retrieves a specific invoice by ID
3. **GET /api/orders/[id]/invoice** - Retrieves all invoices for a specific order
4. **POST /api/orders/[id]/invoice** - Creates a new invoice record for an order

## Storage Configuration

We've updated the storage configuration to include the invoices bucket:

```typescript
const BUCKETS = {
  ORDERS: 'orders',
  PROFILES: 'profiles',
  RECEIPTS: 'receipts',
  MATERIALS: 'materials',
  INVOICES: 'invoices',
};
```

## UI Improvements

1. **Invoice Button in Order Row**:
   - Shows "View" if an invoice exists, "Invoice" if not
   - Uses green color for existing invoices
   - Provides visual feedback on invoice status

2. **Invoice Action in Dropdown Menu**:
   - Shows "View Invoice" if an invoice exists, "Generate Invoice" if not
   - Uses green color for existing invoices

## Type Definitions

We've added comprehensive type definitions for the invoice system:

1. **Invoice Interface** - Represents an invoice record
2. **InvoiceSettings Interface** - Represents invoice generation settings
3. **InvoiceFilters Interface** - For filtering invoices
4. **InvoiceListItem Interface** - For displaying invoices in lists
5. **InvoiceDetail Interface** - For displaying detailed invoice information
6. **InvoiceCreateParams Interface** - For creating new invoices
7. **InvoiceResponse Interface** - For API responses

## Invoice Generation Process

We've improved the invoice generation process:

1. **Client-side PDF Generation** - Using jsPDF and jspdf-autotable
2. **Supabase Storage Upload** - Storing PDFs in the invoices bucket
3. **Database Record Creation** - Creating a record in the invoices table
4. **Order Update** - Updating the order with the latest invoice reference

## Benefits

1. **Improved Tracking** - We can now track when invoices are generated and by whom
2. **Better User Experience** - Users can see which orders have invoices
3. **Sequential Numbering** - Invoices have proper sequential numbers
4. **Centralized Storage** - All invoices are stored in a dedicated bucket
5. **API Access** - Invoices can be accessed via dedicated API endpoints
