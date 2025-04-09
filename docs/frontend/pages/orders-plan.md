
# Orders Page Implementation Guide

## Introduction
This document provides a comprehensive implementation guide for the Orders Page in the Ivan Prints Business Management System. The Orders Page is a core feature that supports order management and related tasks through a tabbed interface, handling 30 orders/day (up to 70 during peak seasons).

## Table of Contents
1. [Database Structure](#database-structure)
2. [UI Components](#ui-components)
3. [API Endpoints](#api-endpoints)
4. [Core Functionality](#core-functionality)
5. [Role-Based Access](#role-based-access)
6. [Testing Checklist](#testing-checklist)
7. [Implementation Tasks](#implementation-tasks)

## Database Structure

### Tables

#### 1. Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    client_type VARCHAR(20) CHECK (client_type IN ('Contract', 'Regular')),
    order_date DATE NOT NULL,
    order_status VARCHAR(20) CHECK (order_status IN ('Paused', 'In Progress', 'Completed', 'Delivered', 'Cancelled')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Mobile Payment')),
    total_amount DECIMAL(10, 2) NOT NULL,
    cash_paid DECIMAL(10, 2) DEFAULT 0,
    balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - cash_paid) STORED,
    payment_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN cash_paid = 0 THEN 'Unpaid'
            WHEN cash_paid < total_amount THEN 'Partially Paid'
            ELSE 'Paid'
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
```

#### 2. Order Items Table
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    item_id INTEGER REFERENCES items(id),
    size VARCHAR(50),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    profit_amount DECIMAL(10, 2) DEFAULT 0,
    labor_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

#### 3. Order Payments Table
```sql
CREATE TABLE order_payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(50) CHECK (payment_type IN ('Cash', 'Bank Transfer', 'Mobile Payment')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_payments_order_id ON order_payments(order_id);
```

#### 4. Order Notes Table
```sql
CREATE TABLE order_notes (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    note_type VARCHAR(20) CHECK (note_type IN ('Info', 'Client Follow-Up', 'Urgent', 'Internal')),
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_notes_order_id ON order_notes(order_id);
CREATE INDEX idx_order_notes_note_type ON order_notes(note_type);
```

#### 5. Order Tasks Table
```sql
CREATE TABLE order_tasks (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(20) CHECK (status IN ('Pending', 'Completed')) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_tasks_order_id ON order_tasks(order_id);
CREATE INDEX idx_order_tasks_due_date ON order_tasks(due_date);
CREATE INDEX idx_order_tasks_status ON order_tasks(status);
```

#### 6. Clients Table
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_name ON clients(name);
```

#### 7. Categories Table
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. Items Table
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category_id)
);

CREATE INDEX idx_items_category_id ON items(category_id);
```

## UI Components

### Layout Structure
- **Page Container**: Flexbox layout with header and content areas
- **Tab Navigation**: Horizontal tabs (Orders, Tasks)
- **Header**: Flex container with metrics, filters, and action buttons
- **Content Area**: Dynamic based on active tab

### 1. Orders Tab Components

#### Header Section
- **Quick Metrics (Admin/Manager)**: Card showing "Total Orders Today: X"
- **Add Order Button**: Green button that opens modal
- **Filters Section**:
  - Date Range Picker
  - Client Dropdown (searchable)
  - Status Dropdown (multi-select)
  - Payment Status Dropdown (multi-select)
- **Search Input**: Global search for order number, client name, etc.

#### Content Section
- **Orders Table**:
  - **Columns**:
    - Order Number (sortable)
    - Client Name (sortable)
    - Date (sortable)
    - Total Amount (sortable)
    - Cash Paid
    - Balance
    - Payment Status (color-coded)
    - Order Status (color-coded)
    - Actions (3-dot menu)
  - **Row Properties**:
    - Expandable for subrow content
    - Color coding based on status
  - **Pagination**:
    - Row counts: 10 (desktop), 3 (mobile)
    - "Show More" button (loads +5 rows)
  - **Empty State**: Message when no orders match filters

#### Expandable Subrow
- **Order Items Section**:
  - Mini-table with columns: Category, Item, Size, Qty, Unit Price, Total Cost
- **Notes Section** (if present):
  - List of notes with type indicator and text

#### Actions Menu (3-dot)
- **Admin/Manager Options**:
  - View Order
  - Edit Order
  - Delete Order (requires approval)
  - Duplicate Order
  - Generate/View Invoice
  - Quick Status Updates dropdown
- **Employee Options**:
  - View Order
  - Generate/View Invoice

### 2. Tasks Tab Components

#### Header Section
- **Quick Metrics (All users)**: Card showing "Total Tasks Today: X"
- **Add Task Button**: Green button that opens modal
- **Filters Section**:
  - Priority Dropdown (multi-select)
  - Due Date Range Picker
  - Status Dropdown (multi-select)

#### Content Section
- **Task Cards Grid**:
  - **Card Elements**:
    - Card Title: Order Number
    - Task Title
    - Description (Note if available)
    - Due Date
    - Priority (color-coded)
    - Status
    - Action buttons
  - **Pagination**:
    - Default counts: 10 (desktop), 3 (mobile)
    - "Show More" button (loads +5 cards)
  - **Empty State**: Message when no tasks match filters

### 3. Modal Components

#### Add/Edit Order Modal
- **Tabbed Layout**: General Info, Items, Payments, Notes
- **General Info Tab**:
  - Client Name (Smart Dropdown)
  - Client Type Dropdown
  - Order Date Picker
  - Order Status Dropdown
  - Payment Method Dropdown
  - Auto-calculation displays (Total Amount, Cash Paid, Balance)
- **Items Tab**:
  - Multi-entry form with:
    - Category (Smart Dropdown)
    - Item (Smart Dropdown)
    - Size (Smart Dropdown)
    - Qty Input
    - Unit Price Input
    - Total Cost (auto-calculated)
    - Add/Remove buttons
- **Payments Tab**:
  - Multi-entry form with:
    - Amount Input
    - Date Picker
    - Payment Type Dropdown
    - Add/Remove buttons
- **Notes Tab**:
  - Multi-entry form with:
    - Type Dropdown
    - Text Input
    - Add/Remove buttons
- **Action Buttons**:
  - Save
  - Cancel

#### View Order Modal
- **General Info Section**:
  - Order details displayed in a clear layout
  - Generate/View Invoice button
- **Items Section**:
  - Minimal Cards for each item
  - Quick Add form for new items
- **Payments Section**:
  - Minimal Cards for each payment
  - Quick Add form for new payments
- **Notes Section**:
  - List of notes with edit capability
  - Quick Add form for new notes
- **Timeline Section**:
  - Chronological log of order events
- **Action Buttons**:
  - Close
  - Edit Order

#### Add/Edit Task Modal
- **Fields**:
  - Title Input
  - Description Textarea
  - Due Date Picker
  - Priority Dropdown
  - Linked Order Dropdown
  - Status Dropdown
- **Recurring Options**:
  - Toggle switch
  - Frequency Dropdown (if recurring)
  - End Date Picker (optional)
- **Action Buttons**:
  - Save
  - Cancel

#### Invoice Modal
- **Tabs**: Preview, Customization
- **Preview Tab**:
  - Rendered invoice based on template
- **Customization Tab**:
  - Business Info fields (editable)
  - Payment Details fields (editable)
  - Toggle options for optional sections
- **Action Buttons**:
  - Save & Print
  - Add Items
  - Close

## API Endpoints

### Orders Endpoints

#### GET /api/orders
- **Query Parameters**:
  - page: number
  - pageSize: number
  - startDate: date
  - endDate: date
  - client: number
  - status: string[]
  - paymentStatus: string[]
  - search: string
- **Response**: Paginated list of orders with basic information

#### GET /api/orders/:id
- **Response**: Complete order details including items, payments, notes

#### POST /api/orders
- **Body**: Order data including items, payments, notes
- **Response**: Created order details

#### PUT /api/orders/:id
- **Body**: Updated order data
- **Response**: Updated order details

#### DELETE /api/orders/:id
- **Response**: Success message or pending approval notification

#### POST /api/orders/:id/duplicate
- **Response**: New duplicated order details

#### GET /api/orders/:id/invoice
- **Response**: Invoice data

#### PUT /api/orders/:id/status
- **Body**: New status
- **Response**: Updated order

### Tasks Endpoints

#### GET /api/tasks
- **Query Parameters**:
  - page: number
  - pageSize: number
  - priority: string[]
  - dueDate: date range
  - status: string[]
- **Response**: Paginated list of tasks

#### GET /api/tasks/:id
- **Response**: Complete task details

#### POST /api/tasks
- **Body**: Task data
- **Response**: Created task details

#### PUT /api/tasks/:id
- **Body**: Updated task data
- **Response**: Updated task details

#### DELETE /api/tasks/:id
- **Response**: Success message or pending approval notification

#### PUT /api/tasks/:id/complete
- **Response**: Updated task with completed status

### Supporting Endpoints

#### GET /api/clients
- **Response**: List of clients for dropdowns

#### GET /api/categories
- **Response**: List of categories for dropdowns

#### GET /api/items
- **Query Parameters**:
  - category: number
- **Response**: List of items for the selected category

## Core Functionality

### 1. Order Management

#### Adding Orders
1. User clicks "Add Order" button
2. Modal opens with General Info tab active
3. User fills out client information (smart dropdown suggests existing clients)
4. User adds order items (with category, item, size, quantity, unit price)
5. User adds payments (if any)
6. User adds notes (if any)
7. System calculates totals (total amount, cash paid, balance)
8. User saves the order
9. System:
   - Generates a unique order number
   - Stores order in database
   - Updates cached counts
   - Shows success message
   - Refreshes orders list

#### Viewing Orders
1. User clicks on an order in the table
2. Modal opens with comprehensive order details
3. User can view items, payments, notes, and timeline
4. User can quickly add new items, payments, or notes inline

#### Editing Orders
1. User selects "Edit Order" from actions menu
2. Modal opens with current data pre-filled
3. User makes changes to any section
4. System recalculates totals as needed
5. User saves the order
6. System updates the database and refreshes the view

#### Duplicating Orders
1. User selects "Duplicate Order" from actions menu
2. System creates a new order with:
   - Same client information
   - Same items
   - Reset date (to current)
   - Reset payment details
   - Reset status to "Paused"
3. Edit modal opens with the new order data
4. User makes any necessary adjustments
5. User saves the new order

#### Deleting Orders
1. User selects "Delete Order" from actions menu
2. Confirmation dialog appears
3. If confirmed:
   - For Admin/Manager: Request sent to Approvals Page
   - For Employee: Not available
4. On approval, order is deleted from database

#### Updating Order Status
1. User selects new status from quick status menu
2. System updates order status
3. Timeline is updated
4. If status becomes "Completed" or "Delivered", generates task for follow-up (if unpaid)

#### Generating/Viewing Invoices
1. User clicks "Generate Invoice" or "View Invoice"
2. Invoice modal opens
3. For new invoices:
   - System pre-fills data from order
   - User can customize invoice details
4. For existing invoices:
   - System shows the saved invoice
   - User can still edit details
5. User can print or save as PDF

### 2. Task Management

#### Adding Tasks
1. User clicks "Add Task" button
2. Modal opens with task form
3. User fills out task details:
   - Title
   - Description
   - Due Date
   - Priority
   - Linked Order (optional)
   - Recurring settings (if applicable)
4. User saves the task
5. System stores task and refreshes task view

#### Viewing Tasks
1. Tasks appear as cards in the Tasks tab
2. Each card shows key information about the task
3. User can click on a task to view full details

#### Completing Tasks
1. User clicks "Mark Complete" on a task card
2. System updates task status to "Completed"
3. Task card is updated visually

#### Editing Tasks
1. User clicks "Edit" on a task card
2. Modal opens with current data pre-filled
3. User makes changes
4. User saves the task
5. System updates the database and refreshes the view

#### Auto-generated Tasks
1. System generates tasks automatically from:
   - Notes with type "Client Follow-Up" or "Urgent"
   - Unpaid orders after 7, 14, or 21 days
2. Auto-tasks appear in the Tasks tab like manual tasks

### 3. Smart Dropdowns

#### Client Selection
1. User starts typing in client field
2. Dropdown shows matching existing clients
3. User can:
   - Select an existing client
   - Create a new client (enters name, optional address and contact)
4. Selection populates the client field

#### Category & Item Selection
1. User selects a category from dropdown
2. Item dropdown is filtered to show only items in that category
3. User can add new categories or items on-the-fly
4. Size field offers common sizes based on selected item

### 4. Filtering & Search

#### Table Filters
1. User selects filters (date range, client, status, payment status)
2. Table updates to show only matching orders
3. Empty state appears if no matches found
4. Filters persist during the session

#### Global Search
1. User types in search box
2. System searches across multiple fields:
   - Order Number
   - Client Name
   - Item descriptions
3. Matching orders are highlighted or filtered

## Role-Based Access

### Admin Access
- Full access to all orders and tasks
- Can view, edit, delete, and duplicate any order
- Can update any order status
- Can generate/view any invoice
- Can access all filters and features
- Can approve delete requests from other users

### Manager Access
- Same access as Admin
- Can approve delete requests from Employees

### Employee Access
- Limited to orders for accessible items (configured in Settings)
- View-only access to orders (no edit, delete, or duplicate)
- Cannot update order status
- Can generate/view invoices for accessible orders
- Can only view and mark complete their assigned tasks
- Limited filter access

## Testing Checklist

### Functionality Tests
- [ ] Order creation with all fields
- [ ] Order viewing with expandable rows
- [ ] Order editing with all sections
- [ ] Order duplication
- [ ] Order deletion and approval flow
- [ ] Order status updates
- [ ] Invoice generation and viewing
- [ ] Task creation and management
- [ ] Smart dropdown functionality
- [ ] Filtering and search

### Role-Based Access Tests
- [ ] Admin access verification
- [ ] Manager access verification
- [ ] Employee access restrictions
- [ ] Deletion approval flow

### UI/UX Tests
- [ ] Responsive design (desktop, tablet, mobile)
- [ ] Table pagination and "Show More" functionality
- [ ] Modal behavior and form validation
- [ ] Color coding for statuses
- [ ] Loading states and error handling

### Performance Tests
- [ ] Load time with 100+ orders
- [ ] Filter operation speed
- [ ] Modal open/close performance
- [ ] Smart dropdown response time

## Implementation Tasks

### Phase 1: Database Setup

1. **Create Database Schema**
   - [ ] Create orders table
   - [ ] Create order_items table
   - [ ] Create order_payments table
   - [ ] Create order_notes table
   - [ ] Create order_tasks table
   - [ ] Create supporting tables (clients, categories, items)
   - [ ] Add necessary indexes for performance
   - [ ] Set up foreign key relationships

2. **Database Seeding**
   - [ ] Create test data for development
   - [ ] Add sample orders, clients, items, etc.

### Phase 2: API Development

3. **Orders API**
   - [ ] Implement GET /api/orders endpoint
   - [ ] Implement GET /api/orders/:id endpoint
   - [ ] Implement POST /api/orders endpoint
   - [ ] Implement PUT /api/orders/:id endpoint
   - [ ] Implement DELETE /api/orders/:id endpoint
   - [ ] Implement POST /api/orders/:id/duplicate endpoint
   - [ ] Implement order status update endpoint

4. **Tasks API**
   - [ ] Implement GET /api/tasks endpoint
   - [ ] Implement GET /api/tasks/:id endpoint
   - [ ] Implement POST /api/tasks endpoint
   - [ ] Implement PUT /api/tasks/:id endpoint
   - [ ] Implement DELETE /api/tasks/:id endpoint
   - [ ] Implement task completion endpoint

5. **Supporting APIs**
   - [ ] Implement client dropdown API
   - [ ] Implement categories dropdown API
   - [ ] Implement items dropdown API
   - [ ] Implement invoice generation API

### Phase 3: UI Component Development

6. **Layout Components**
   - [ ] Create page container with tab navigation
   - [ ] Implement responsive layout with header and content areas
   - [ ] Build tab switching functionality

7. **Orders Tab Components**
   - [ ] Create header with metrics and filter controls
   - [ ] Build orders table component with expandable rows
   - [ ] Implement pagination and "Show More" functionality
   - [ ] Create actions menu (3-dot) with role-based options
   - [ ] Add empty state component

8. **Tasks Tab Components**
   - [ ] Create header with metrics and filter controls
   - [ ] Build task cards grid component
   - [ ] Implement pagination and "Show More" functionality
   - [ ] Add empty state component

9. **Modal Components**
   - [ ] Build add/edit order modal with tabbed interface
   - [ ] Create view order modal with all sections
   - [ ] Build add/edit task modal
   - [ ] Create invoice modal with preview and customization tabs

10. **Smart Dropdown Components**
    - [ ] Implement client smart dropdown with search and create functionality
    - [ ] Build category and item linked dropdowns
    - [ ] Create size suggestions dropdown

### Phase 4: Functionality Implementation

11. **Order Management Functions**
    - [ ] Implement add order functionality
    - [ ] Build order viewing logic
    - [ ] Create order editing functionality
    - [ ] Implement order duplication
    - [ ] Add order deletion and approval workflow
    - [ ] Build status update functionality
    - [ ] Create invoice generation system

12. **Task Management Functions**
    - [ ] Implement add task functionality
    - [ ] Build task viewing logic
    - [ ] Create task editing functionality
    - [ ] Implement task completion
    - [ ] Build auto-task generation from notes
    - [ ] Create recurring task functionality

13. **Filtering & Search Functions**
    - [ ] Implement date range filtering
    - [ ] Build client and status filters
    - [ ] Create global search functionality
    - [ ] Add filter persistence during session

### Phase 5: Role-Based Access Implementation

14. **Role Access Control**
    - [ ] Implement admin access permissions
    - [ ] Build manager access controls
    - [ ] Create employee access restrictions
    - [ ] Add role-based UI element visibility
    - [ ] Implement approval workflow for deletions

### Phase 6: Testing & Optimization

15. **Testing**
    - [ ] Conduct functionality tests
    - [ ] Perform role-based access tests
    - [ ] Test UI/UX components
    - [ ] Run performance tests

16. **Optimization**
    - [ ] Optimize database queries
    - [ ] Improve component rendering performance
    - [ ] Enhance responsive design
    - [ ] Implement proper caching strategies

### Phase 7: Integration & Deployment

17. **Integration**
    - [ ] Integrate with other app sections (Dashboard, Analytics)
    - [ ] Connect with notifications system
    - [ ] Link with user management and permissions

18. **Final Deployment**
    - [ ] Deploy to staging environment
    - [ ] Conduct final testing
    - [ ] Deploy to production
    - [ ] Monitor performance and user feedback

## Conclusion

This implementation plan provides a comprehensive guide for developing the Orders Page of the Ivan Prints Business Management System. By following the phases and tasks outlined, developers can systematically build a robust, user-friendly, and feature-rich orders management system that meets the specified requirements.

The plan ensures that all core functionality is addressed, including order and task management, role-based access control, and integration with other system components. Regular testing throughout the implementation process will help identify and resolve issues early, ensuring a smooth deployment to production.
