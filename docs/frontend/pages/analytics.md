# Dashboard/Analytics Page Implementation Guide

## Overview
The Dashboard/Analytics Page provides insights into business performance through various metrics, charts, and summaries. Access and displayed data vary significantly based on user roles.

## Layout Structure
- **Header**: Page Title ("Dashboard" or "Analytics") and Date Range Selector (defaulting to "Last 30 Days").
- **Content**: A grid of widgets displaying different metrics and visualizations.

## Dynamic Content & Role-Based Access

### Admin View
- **Access**: Full access to all analytics data.
- **Widgets**:
  - **Key Performance Indicators (KPIs)**:
    - Total Revenue (vs. Prev Period)
    - Total Profit (vs. Prev Period)
    - Total Orders (vs. Prev Period)
    - Average Order Value (vs. Prev Period)
    - Total Expenses (vs. Prev Period)
    - Total Material Purchase Cost (vs. Prev Period)
  - **Charts & Graphs**:
    - Revenue vs. Profit Over Time (Line Chart)
    - Expense Breakdown by Category (Pie Chart)
    - Order Volume Over Time (Bar Chart)
    - Top Selling Items/Services (Bar Chart)
    - Material Purchase Costs Over Time (Line Chart)
  - **Summaries**:
    - Recent Orders (Table snippet, link to Orders Page)
    - Pending Order Approvals (Count, link to Orders Page)
    - Recent Expenses (Table snippet, link to Expenses Page)
    - Recent Material Purchases (Table snippet, link to Purchases Page)

### Manager View
- **Access**: Access to operational metrics, excluding detailed profit/cost data.
- **Widgets**:
  - **KPIs**:
    - Total Revenue (vs. Prev Period)
    - Total Orders (vs. Prev Period)
    - Average Order Value (vs. Prev Period)
    - Order Completion Rate
  - **Charts & Graphs**:
    - Order Volume Over Time (Bar Chart)
    - Order Status Distribution (Pie Chart)
    - Task Completion Rate (Personal & Assigned)
  - **Summaries**:
    - Recent Orders (Table snippet, link to Orders Page)
    - Pending Order Approvals (Count, link to Orders Page)
    - Assigned Tasks Overview (Count by Status, link to Tasks)

### Employee View
- **Access**: Limited to personal performance and assigned tasks.
- **Widgets**:
  - **KPIs**:
    - Completed Orders (Assigned)
    - Completed Tasks (Personal & Assigned)
  - **Summaries**:
    - My Assigned Orders (Table snippet, link to Orders)
    - My Pending Tasks (Card snippet, link to Personal To-Do/Assigned Tasks)

## Widget Specifications
- **KPI Widget**: Displays metric name, value, percentage change indicator (up/down arrow, color), and comparison period text.
- **Chart Widget**: Displays chart title, chart visualization, legend (if applicable).
- **Summary Widget**: Displays title, brief data snippet (table rows or cards), and a "View All" link to the relevant page.

## Filters
- **Primary Filter**: Date Range Selector (Applies to most widgets).
  - Options: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom Range.

## Loading States
- **Initial Page Load**: Skeleton loaders for each widget position.
- **Widget Data Load**: Individual spinner within each widget until its data is fetched.
- **Filter Change**: Spinners appear on affected widgets while data reloads.

## Error Handling
- **Widget Error**: If a widget fails to load data, display an error message within the widget boundary (e.g., "Could not load Revenue data. Try again?") with a retry button.
- **Toast Messages**: For general page-level errors (e.g., unable to fetch initial configuration).

## Mobile Adaptations
- **Widget Layout**: Single-column layout, widgets stack vertically.
- **Charts**: Simplified versions or allow horizontal scrolling for wider charts.
- **Date Range Selector**: May be placed in a persistent header or accessed via a filter button.

## Implementation Notes
1.  **Performance**: Optimize database queries for analytics. Consider pre-calculating some metrics or using materialized views if performance becomes an issue.
2.  **Data Fetching**: Fetch data for each widget independently to avoid blocking the entire page if one query is slow.
3.  **Charting Library**: Choose a responsive charting library (e.g., Recharts, Chart.js).
4.  **Role-Based Logic**: Implement robust server-side checks to ensure users only receive data appropriate for their role.
5.  **Caching**: Implement caching strategies for analytics data, especially for common date ranges. 