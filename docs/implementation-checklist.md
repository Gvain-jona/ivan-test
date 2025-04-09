# Ivan Prints Implementation Checklist

This document outlines the step-by-step implementation plan for the Ivan Prints Business Management System, broken into manageable tasks. Each phase focuses on a specific aspect of the system, allowing for incremental progress and validation.

## Phase 1: Project Setup and Authentication (Estimated: 5-7 days)

### Project Infrastructure
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up folder structure (app, components, lib, etc.)
- [ ] Configure Supabase client (server and browser)
- [ ] Set up environment variables (.env.local)
- [ ] Configure middleware for auth routes
- [ ] Set up basic layout components (Layout, Sidebar, Navbar)

### Database Foundation
- [ ] Create migration for users table updates
  - [ ] Add PIN, verification_code, code_expiry, is_verified, failed_attempts fields
  - [ ] Create appropriate indexes 
- [ ] Create migration for sessions table updates
  - [ ] Add device_id field
  - [ ] Create appropriate indexes
- [ ] Create database functions
  - [ ] Verification code generation function
  - [ ] Device management functions (add/remove devices)
  - [ ] Code regeneration function
- [ ] Update Row Level Security policies for users and sessions tables

### Authentication UI
- [ ] Create Email Input page
- [ ] Create Verification Code page
- [ ] Create PIN Setup page
- [ ] Create PIN Entry page
- [ ] Create PIN Reset flow pages
- [ ] Create Device Limit Reached page
- [ ] Add loading states (spinners, skeletons)
- [ ] Add error handling (toast messages, inline errors)

### Authentication API
- [ ] Implement verify-email endpoint
- [ ] Implement verify-code endpoint
- [ ] Implement setup-pin endpoint
- [ ] Implement pin-login endpoint
- [ ] Implement reset-pin-request endpoint
- [ ] Implement verify-reset-code endpoint
- [ ] Implement complete-pin-reset endpoint
- [ ] Implement check-session endpoint
- [ ] Implement refresh-session endpoint
- [ ] Implement logout endpoint

## Phase 2: Core Pages and Navigation (Estimated: 5-7 days)

### Layout and Navigation
- [ ] Create responsive sidebar
  - [ ] Add company branding section
  - [ ] Create navigation links with icons
  - [ ] Add collapsible feature for mobile
- [ ] Create top navbar
  - [ ] Add notification bell
  - [ ] Add profile icon and dropdown
  - [ ] Add help icon
  - [ ] Add logout functionality
- [ ] Implement responsive layout wrapper
- [ ] Create 404 page and error handling

### Home Page
- [ ] Create quick metrics components (role-specific)
- [ ] Create pending invoices section
  - [ ] Implement show more functionality
  - [ ] Add view action
- [ ] Create order summary section with dynamic rows
- [ ] Create expenses summary section (admin/manager only)
- [ ] Create material purchases summary section (admin only)
- [ ] Create personal to-do summary section
- [ ] Implement loading states and error handling
- [ ] Implement role-based visibility

### Profile Page
- [ ] Create profile page layout
- [ ] Implement device listing for employees
- [ ] Add redirect to settings for admins/managers
- [ ] Add loading states and error handling

## Phase 3: Orders Management (Estimated: 7-10 days)

### Database Setup
- [ ] Create/update orders table schema
- [ ] Create/update order_items table schema
- [ ] Create appropriate indexes
- [ ] Set up Row Level Security policies

### Orders Page
- [ ] Create orders page layout with tabs (table/tasks)
- [ ] Implement orders table with dynamic rows
  - [ ] Add sorting and filtering
  - [ ] Implement pagination
  - [ ] Add status indicators
- [ ] Create order-related tasks view
  - [ ] Implement task cards
  - [ ] Add mark complete functionality
- [ ] Implement loading states and error handling
- [ ] Implement role-based access controls

### Order Modals
- [ ] Create Add Order modal
  - [ ] Implement smart dropdowns (client, items)
  - [ ] Add form validation
  - [ ] Implement auto-calculations (totals)
- [ ] Create Edit Order modal
- [ ] Create View Order modal
  - [ ] Implement minimal cards for items
  - [ ] Add inline form for quick additions
- [ ] Create Invoice modal
  - [ ] Implement preview tab
  - [ ] Create customization tab
  - [ ] Add print/PDF functionality

### Order APIs
- [ ] Create order CRUD endpoints
- [ ] Implement order item management
- [ ] Create invoice generation endpoint
- [ ] Implement order status update endpoints
- [ ] Create order task endpoints

## Phase 4: Financial Management (Estimated: 5-7 days)

### Database Setup
- [ ] Create/update expenses table schema
- [ ] Create/update material_purchases table schema
- [ ] Create appropriate indexes
- [ ] Set up Row Level Security policies

### Expenses Page
- [ ] Create expenses page layout with tabs
- [ ] Implement expenses table
  - [ ] Add sorting and filtering
  - [ ] Implement pagination
- [ ] Create expense-related tasks view
- [ ] Implement loading states and error handling
- [ ] Implement role-based access controls

### Material Purchases Page
- [ ] Create material purchases page layout with tabs
- [ ] Implement material purchases table
  - [ ] Add sorting and filtering
  - [ ] Implement pagination
- [ ] Create material purchase-related tasks view
- [ ] Implement loading states and error handling
- [ ] Implement role-based access controls

### Financial Modals and APIs
- [ ] Create Add/Edit Expense modals
- [ ] Create Add/Edit Material Purchase modals
- [ ] Create View modals for both
- [ ] Implement expense CRUD endpoints
- [ ] Implement material purchase CRUD endpoints
- [ ] Create installment payment management endpoints

## Phase 5: Task Management (Estimated: 5-7 days)

### Database Setup
- [ ] Create/update tasks table schema
- [ ] Create appropriate indexes
- [ ] Set up Row Level Security policies

### Personal To-Do Page
- [ ] Create personal to-do page layout
- [ ] Implement task cards view (Todoist-inspired)
- [ ] Create project management functionality
  - [ ] Implement projects list
  - [ ] Add create/edit project functionality
- [ ] Implement subtasks functionality
- [ ] Add task filtering and sorting
- [ ] Implement loading states and error handling

### Task Components
- [ ] Create Add/Edit Task modal
  - [ ] Implement recurrence settings
  - [ ] Add form validation
- [ ] Create View Task modal
- [ ] Implement Mark Complete functionality
- [ ] Create task priority indicators
- [ ] Add snooze functionality

### Task APIs
- [ ] Create task CRUD endpoints
- [ ] Implement recurrence handling
- [ ] Create project management endpoints
- [ ] Implement subtask endpoints
- [ ] Create task status update endpoints

## Phase 6: Notifications and Alerts (Estimated: 3-5 days)

### Database Setup
- [ ] Create notifications table schema
- [ ] Create appropriate indexes
- [ ] Set up triggers for notification generation

### Notification Components
- [ ] Create notification bell dropdown
- [ ] Implement Notifications page
  - [ ] Add filtering by date and status
  - [ ] Implement pagination
- [ ] Create snooze functionality
  - [ ] Add various duration options
- [ ] Implement mark as read functionality
- [ ] Add loading states and error handling

### Notification APIs
- [ ] Create notification retrieval endpoints
- [ ] Implement mark as read/unread endpoints
- [ ] Create snooze endpoint
- [ ] Implement notification count endpoint

### Push Notifications
- [ ] Set up push notification infrastructure
- [ ] Implement security (no sensitive data)
- [ ] Create notification settings in the Settings page
- [ ] Add per-user push notification controls

## Phase 7: Analytics and Settings (Estimated: 7-10 days)

### Analytics Database Setup
- [ ] Create profit calculation functions
- [ ] Set up analytics summary tables
- [ ] Create appropriate indexes
- [ ] Implement RLS policies

### Analytics UI
- [ ] Create analytics page layout
- [ ] Implement profit metrics cards
- [ ] Create charts
  - [ ] Profit trend line chart
  - [ ] Profit by category bar chart
- [ ] Implement data tables
  - [ ] Profit by client table
  - [ ] Detailed breakdown tables
- [ ] Add filtering functionality
- [ ] Implement custom report building
- [ ] Add export functionality (CSV, PDF)
- [ ] Implement loading states and error handling

### Settings Page
- [ ] Create settings layout with sub-navigation
- [ ] Implement General Settings section
  - [ ] Currency, language, theme settings
  - [ ] User limit (admin only)
- [ ] Create Profit Settings section
  - [ ] Calculation basis options
  - [ ] Profit percentage settings
  - [ ] Category overrides
- [ ] Implement Data Management section
  - [ ] Client, item, category, supplier management
  - [ ] Duplicate detection and merging
  - [ ] Inactive item management
- [ ] Create User Management section
  - [ ] User listing and role management
  - [ ] Employee access controls
  - [ ] Device management
- [ ] Implement Notifications settings
- [ ] Create Branding settings
  - [ ] Company name and logo upload
- [ ] Implement Analytics settings
  - [ ] Custom report templates
- [ ] Add Backup and Export functionality

## Phase 8: Testing and Refinement (Estimated: 5-7 days)

### Testing
- [ ] Create unit tests for critical components
- [ ] Implement integration tests for key flows
- [ ] Perform security testing
  - [ ] Test role-based access controls
  - [ ] Verify authentication security
  - [ ] Check for sensitive data exposure
- [ ] Conduct performance testing
  - [ ] Test with 70 orders/day volume
  - [ ] Verify response times under load
- [ ] Execute cross-browser testing
- [ ] Complete mobile responsiveness testing

### Refinement
- [ ] Address usability feedback
- [ ] Fix identified bugs
- [ ] Optimize slow queries or components
- [ ] Implement additional error handling
- [ ] Add helpful tooltips for complex features
- [ ] Improve loading states and transitions

## Phase 9: Documentation and Deployment (Estimated: 3-5 days)

### Documentation
- [ ] Create user documentation
  - [ ] Role-specific guides
  - [ ] Feature walkthroughs
- [ ] Write technical documentation
  - [ ] API documentation
  - [ ] Database schema
  - [ ] Security implementation
- [ ] Prepare admin documentation
  - [ ] Settings configuration
  - [ ] User management
  - [ ] Backup procedures

### Deployment
- [ ] Set up staging environment
- [ ] Deploy to staging for UAT
- [ ] Address UAT feedback
- [ ] Prepare production environment
- [ ] Deploy to production
- [ ] Set up monitoring and alerts
- [ ] Create backup and recovery procedures

## Implementation Notes

### Priority Order
1. Authentication and core infrastructure
2. Home Page and Navigation
3. Orders Management
4. Financial Management
5. Task Management
6. Notifications
7. Analytics and Settings
8. Testing and Refinement
9. Documentation and Deployment

### Removed Elements
- No collection of user IP addresses (as per ethical and legal constraints)
- Instead, device management will use device identifiers based on browser fingerprinting

### Team Coordination
- Daily check-ins to report progress on checklist items
- Weekly reviews to assess phase completion
- Bi-weekly demos to gather stakeholder feedback 