# Ivan Prints Business Management System: Database Setup, Data Collection, and Presentation Plan

This document outlines the database setup approach, data collection methods, and presentation libraries for the Ivan Prints Business Management System analytics setup. It focuses on supporting the original metrics framework, emphasizing payment tracking (unpaid orders, unpaid materials, partially paid expenses), user-friendly design, and weekly to yearly auto-report generation. The plan ensures compatibility with current direct storage of aggregating data (e.g., `client_name`, `category_name`) and future use of aggregating tables (e.g., `clients`, `categories`), covering financial, operational, customer, supplier, and cross-functional insights.

## 1. Objectives

- **Robust Database**: Design a scalable, normalized database schema to support all metrics.
- **Efficient Data Collection**: Implement user-friendly, reliable methods for data entry and validation.
- **Effective Presentation**: Use modern libraries for interactive, visually clear dashboards and reports.
- **Payment Tracking**: Ensure granular tracking of unpaid orders, unpaid materials, and partially paid expenses.
- **Future-Proofing**: Support transition from direct storage to aggregating tables without disrupting metrics.

## 2. Database Setup Approach

The database will use a relational model (e.g., PostgreSQL) for its robustness, query performance, and compatibility with analytics. The schema is normalized to reduce redundancy, with provisions for direct storage (e.g., `client_name` in `orders`) and future aggregating tables (e.g., `clients`). Indexes and constraints ensure performance and data integrity. - Currenlty the application runs on supabase db with data collection mechanism already set and in place

### 2.1 Database Design Principles

- **Normalization**: 3NF to minimize redundancy (e.g., `client_id` links to `clients`).
- **Flexibility**: Nullable `client_id`, `item_id`, etc., support current direct storage and future aggregating tables.
- **Performance**: Indexes on frequently queried fields (e.g., `balance`, `status`) optimize metrics.
- **Integrity**: Foreign keys and constraints ensure data consistency.
- **Scalability**: PostgreSQL supports large datasets and complex queries for analytics.


## 4. Presentation Libraries

Presentation libraries ensure interactive, user-friendly dashboards and reports, supporting metrics like KPIs, charts, and tables.

### 4.1 Dashboard Library: Chart.js

- **Why Chosen**:
    - Lightweight, open-source, and supports all required chart types (line, bar, pie, donut, heatmap, histogram).
    - Easy integration with React for dynamic updates.
    - Customizable for user-friendly design (e.g., bold fonts, color coding).
- **Usage**:
    - **Line Charts**: Total Revenue, Net Profit, Expense Cost Trends (e.g., `data: { labels: months, datasets: [{ data: revenue }]`).
    - **Bar Charts**: Profit Margin by Product Type, Supplier Spend, Order Item Popularity.
    - **Pie/Donut Charts**: Unpaid Orders by Client Type, Installment Payment Status.
    - **Heatmaps**: Order Creation Patterns (hour/day).
    - **Histograms**: Order Turnaround Time, Expense Approval Time.
- **Features**:
    - Tooltips: Display metric details (e.g., “Orders Due: $5,000” on hover).
    - Color Coding: Green for revenue/profit, red for dues/delays, blue for categories/suppliers.
    - Responsive: Adapts to desktop/mobile for non-technical users.
- **Example**:
    - Outstanding Balances: Bar chart with `labels: ['0-30 days', '31-60 days', '61+']`, `data: [1000, 2000, 500]`, red fill for overdue.

### 4.2 Table Library: React-Table

- **Why Chosen**:
    - Flexible, supports sorting, filtering, and pagination for tables (e.g., Top 5 Unpaid Orders).
    - Integrates with React for drill-downs and dynamic updates.
    - Lightweight and customizable for user-friendly design.
- **Usage**:
    - **Tables**: Outstanding Balances, Client Activity, Supplier Spend.
    - **Features**:
        - Sorting: By `balance`, `order_count`, `total_amount`.
        - Filtering: By `client_name`, `payment_status`, `supplier_name`.
        - Drill-Downs: Click row to view order details (e.g., `order_number`, `notes`).
        - Pagination: 10 rows per page for large datasets.
    - **Example**:
        - Unpaid Orders: Table with columns `order_number`, `client_name`, `balance`, `payment_status`, sortable by `balance`.


### 4.4 Styling: Tailwind CSS/ shadcn library

- **Why Chosen**:
    - Utility-first CSS framework for rapid, consistent styling.
    - Supports responsive design for desktop/mobile.
    - Customizable for user-friendly design (e.g., bold fonts, icons).
- **Usage**:
    - **Dashboards**: `text-4xl font-bold text-green-600` for KPIs, `bg-red-100` for overdue alerts.
    - **Tables**: `border-collapse table-auto` for clean tables, `hover:bg-gray-100` for row interactions.
    - **Reports**: `text-blue-800` for headers, `flex justify-center` for chart alignment.
- **Example**:
    - Orders Due KPI: `<div class="text-4xl font-bold text-red-600">Orders Due: $5,000</div>`.

### 4.5 Integration

- **React**: Combines Chart.js, React-Table, jsPDF, and Tailwind CSS for a cohesive frontend.
    - **Example**: Dashboard component renders Chart.js for Total Revenue, React-Table for Outstanding Balances, styled with Tailwind.
- **Supabase REST API**: Serves data to React frontend.
    - **Endpoints**:
        - `/api/orders/`: Returns `total_amount`, `balance`, `status` for revenue and payment metrics.
        - `/api/expenses/`: Returns `total_amount`, `balance`, `category` for cost metrics.
        - `/api/materials/`: Returns `total_amount`, `installments` for procurement metrics.
    - **Example**: `GET /api/orders/?status=completed` for Total Revenue.
- **Celery**: Schedules report generation (e.g., weekly PDFs emailed via Django-celery).


## 6. Presentation Workflow

1. **Dashboard**:
    - React fetches data via Django REST API (e.g., `/api/orders/`).
    - Chart.js renders charts (e.g., Total Revenue line chart).
    - React-Table displays tables (e.g., Outstanding Balances).
    - Tailwind styles components (e.g., red for overdue KPIs).
2. **Drill-Downs**:
    - Click chart segment (e.g., product type) to filter API query (e.g., `/api/orders/?category_name=Print`).
    - Click table row to view details (e.g., order items via `/api/order_items/?order_id=123`).
3. **Reports**:
    - Celery task generates PDF weekly/monthly.
    - jsPDF combines KPIs (text), charts (Chart.js canvas), tables (React-Table data).
    - Email report to users via Django-celery.

## 7. User-Friendly Design

- **Simplified Language**: Labels like “Sales”, “Orders Due”, “Bills Due” in forms and dashboards.
- **Visual Clarity**:
    - Chart.js: Bold fonts (24pt KPIs), color coding (green for revenue, red for dues).
    - React-Table: Clear column headers, hover effects.
    - jsPDF: Consistent fonts/icons in reports.
- **Guided Navigation**:
    - Tooltips: “Orders Due: Amount customers owe” (Chart.js).
    - Instructions: “Select customer to view orders” (React-Table).
- **Role-Based Access**:
    - Non-Technical: View KPIs (Sales, Orders Due).
    - Managers: Access trends (Profit, Client Activity).
    - Finance: Edit payments, view tables (Unpaid Orders).
    - Operations: Monitor efficiency (Turnaround Time).

