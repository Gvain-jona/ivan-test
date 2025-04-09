# Role-Based UI Variations

This document outlines the UI differences across the three user roles (Admin, Manager, Employee) in the Ivan Prints Business Management System. Understanding these variations is crucial for implementing proper access controls and ensuring each user sees only what is relevant to their role.

## Overview of Roles

### Admin
- **Access Level**: Full access to all features and data
- **Special Permissions**:
  - Configure technical settings (currency, language, user limit)
  - Manage all users (add, edit, deactivate)
  - View all analytics and reports
  - View all devices for all users
  - Access Material Purchases page

### Manager
- **Access Level**: Most functionality, limited technical settings
- **Special Permissions**:
  - Cannot configure technical settings
  - Can add/edit users but not see user limit
  - View all analytics and reports
  - View only Employee devices (not Admin devices)
  - Cannot access Material Purchases page

### Employee
- **Access Level**: Limited to specific tasks and data
- **Special Permissions**:
  - View/add orders (limited to accessible items)
  - View own tasks
  - View/manage own devices in Profile
  - No access to Analytics, Settings pages

## Page-Specific Role Variations

### Home Page

#### Admin View
- **Quick Metrics** (4 Cards):
  - Today's Orders (clickable to Analytics)
  - Today's Expenses (clickable to Analytics)
  - Today's Material Purchases (clickable to Analytics)
  - Pending Tasks (clickable to Analytics)
- **Pending Invoices**: Full access
- **Summaries**: All four sections (Orders, Expenses, Material Purchases, Personal To-Do)
- **Actions**: Add Order, Add Expense, Add Material Purchase, Add Task buttons

#### Manager View
- **Quick Metrics** (3 Cards):
  - Today's Orders (clickable to Analytics)
  - Today's Expenses (clickable to Analytics)
  - Pending Tasks (clickable to Analytics)
- **Pending Invoices**: Full access
- **Summaries**: Three sections (Orders, Expenses, Personal To-Do)
- **Actions**: Add Order, Add Expense, Add Task buttons

#### Employee View
- **Quick Metrics** (1 Card):
  - Your Pending Tasks (non-clickable)
- **Pending Invoices**: Filtered to accessible orders only
- **Summaries**: Two sections (Orders - filtered to accessible items, Personal To-Do)
- **Actions**: Add Order (restricted to accessible items), Add Task buttons

### Orders Page

#### Admin View
- **Orders Tab**: Full access to all orders
  - **Actions**: View, Edit, Delete (with approval), Duplicate
  - **Quick Status Updates**: Paused → In Progress → Completed → Delivered
  - **Invoice Actions**: Generate/View Invoice
- **Tasks Tab**: Full access to all order-related tasks
  - **Actions**: View, Edit, Delete, Mark Complete
  - **Filters**: Full access (Priority, Due Date, Status)

#### Manager View
- **Orders Tab**: Same as Admin
- **Tasks Tab**: Same as Admin

#### Employee View
- **Orders Tab**: Limited to accessible items (configured in Settings)
  - **Actions**: View only (no Edit, Delete, or Duplicate)
  - **No Quick Status Updates**
  - **Invoice Actions**: Generate/View Invoice for accessible orders
- **Tasks Tab**: Limited to tasks for accessible orders
  - **Actions**: View, Mark Complete (no Edit or Delete)
  - **Filters**: Limited access

### Expenses Page

#### Admin View
- **Expenses Tab**: Full access to all expenses
  - **Actions**: View, Edit, Delete (with approval)
  - **Installments**: View, Add, Edit
- **Tasks Tab**: Full access to all expense-related tasks
  - **Actions**: View, Edit, Delete, Mark Complete
  - **Filters**: Full access

#### Manager View
- **Expenses Tab**: Same as Admin
- **Tasks Tab**: Same as Admin

#### Employee View
- No access to Expenses page (redirected to Home Page)

### Material Purchases Page

#### Admin View
- **Material Purchases Tab**: Full access to all purchases
  - **Actions**: View, Edit, Delete (with approval)
  - **Installments**: View, Add, Edit
- **Tasks Tab**: Full access to all purchase-related tasks
  - **Actions**: View, Edit, Delete, Mark Complete
  - **Filters**: Full access

#### Manager View
- No access to Material Purchases page (redirected to Home Page)

#### Employee View
- No access to Material Purchases page (redirected to Home Page)

### Personal To-Do Page

#### Admin View
- **Tasks List**: Full access to personal tasks
  - **Actions**: View, Edit, Delete, Mark Complete
  - **Projects**: Create, Edit, Delete projects
  - **Subtasks**: Create, Edit, Delete subtasks
  - **Filters**: Full access

#### Manager View
- **Tasks List**: Same as Admin

#### Employee View
- **Tasks List**: Access to own personal tasks
  - **Actions**: View, Edit, Delete, Mark Complete
  - **Projects**: Create, Edit, Delete projects
  - **Subtasks**: Create, Edit, Delete subtasks
  - **Filters**: Limited access

### Dashboard/Analytics Page

#### Admin View
- **Orders Analytics**: Full access
- **Finance Analytics**: Full access
- **Client Analytics**: Full access
- **Export Options**: CSV, PDF for all reports
- **Custom Reports**: Create, Save, Load

#### Manager View
- **Orders Analytics**: Full access
- **Finance Analytics**: Full access
- **Client Analytics**: Full access
- **Export Options**: CSV, PDF for all reports
- **Custom Reports**: Create, Save, Load

#### Employee View
- No access to Dashboard/Analytics page (redirected to Home Page)

### Settings Page

#### Admin View
- **General Settings**: Full access (Currency, Language, Theme, User Limit)
- **Profit Settings**: Full access
- **Data Management**: Full access (Clients, Items, Categories, Suppliers)
- **User Management**: Full access (Add, Edit, Deactivate users, set limits)
  - **Device Management**: See all users' devices
- **Notifications**: Full access (Configure push, reminders)
- **Branding**: Full access
- **Analytics**: Full access
- **Backup**: Full access

#### Manager View
- **General Settings**: Limited (Only Theme, no Currency, Language, User Limit)
- **Profit Settings**: Full access
- **Data Management**: Full access
- **User Management**: Limited (Add, Edit users, no deactivation or limits)
  - **Device Management**: See only Employee devices
- **Notifications**: Full access (except push toggle)
- **Branding**: Full access
- **Analytics**: Full access
- **Backup**: Full access

#### Employee View
- No access to Settings page (redirected to Home Page)

### Notifications Page

#### Admin View
- **Notifications List**: All notifications
  - **Types**: Failed logins, system events, orders, tasks, etc.
  - **Actions**: Mark as Read, Snooze, View Item
  - **Filters**: Full access

#### Manager View
- **Notifications List**: Most notifications
  - **Types**: Failed logins, system events, orders, tasks, etc.
  - **Actions**: Mark as Read, Snooze, View Item
  - **Filters**: Full access

#### Employee View
- **Notifications List**: Limited notifications
  - **Types**: Tasks, accessible orders
  - **Actions**: Mark as Read, Snooze, View Item
  - **Filters**: Limited access

### Profile Page

#### Admin View
- Redirects to Settings > User Management

#### Manager View
- Redirects to Settings > User Management

#### Employee View
- **Device List**: View own logged-in devices
  - No actions (read-only)

## Action Button Visibility

### Add/Create Buttons

| Button | Admin | Manager | Employee |
|--------|-------|---------|----------|
| Add Order | ✅ | ✅ | ✅ (limited) |
| Add Expense | ✅ | ✅ | ❌ |
| Add Material Purchase | ✅ | ❌ | ❌ |
| Add Task | ✅ | ✅ | ✅ |
| Add User | ✅ | ✅ | ❌ |
| Generate Invoice | ✅ | ✅ | ✅ (limited) |

### Edit/Delete Buttons

| Button | Admin | Manager | Employee |
|--------|-------|---------|----------|
| Edit Order | ✅ | ✅ | ❌ |
| Delete Order | ✅ (approval) | ✅ (approval) | ❌ |
| Duplicate Order | ✅ | ✅ | ❌ |
| Edit Expense | ✅ | ✅ | ❌ |
| Delete Expense | ✅ (approval) | ✅ (approval) | ❌ |
| Edit Purchase | ✅ | ❌ | ❌ |
| Delete Purchase | ✅ (approval) | ❌ | ❌ |
| Edit Task | ✅ | ✅ | ✅ (own tasks) |
| Delete Task | ✅ (approval) | ✅ (approval) | ✅ (own tasks, approval) |
| Edit User | ✅ | ✅ | ❌ |
| Deactivate User | ✅ | ❌ | ❌ |

## Modal Content Variations

### Add/Edit Order Modal

#### Admin/Manager
- **All Fields Visible and Editable**:
  - Client Name, Client Type
  - Order Date, Order Status
  - Items (Category, Item, Size, Qty, Unit Price)
  - Payments (Amount, Date, Type)
  - Notes

#### Employee
- **Limited Fields**:
  - Client Name, Client Type
  - Order Date (read-only Status)
  - Items (limited to accessible items)
  - No Unit Price editing
  - No Payments section
  - Notes

### View Order Modal

#### Admin/Manager
- **All Sections Visible**:
  - General Info
  - Items (with Quick Add)
  - Payments (with Quick Add)
  - Notes (with Quick Add)
  - Timeline
  - Generate/View Invoice button

#### Employee
- **Limited Sections**:
  - General Info
  - Items (no Quick Add)
  - Payments (no Quick Add)
  - Notes (with Quick Add)
  - Timeline
  - Generate/View Invoice button

## Implementation Guidance

### Role-Based Access Control

```typescript
// Example of role-based UI rendering
const OrderActions = ({ order, userRole }) => {
  return (
    <div className="order-actions">
      {/* View button - visible to all roles */}
      <Button onClick={() => viewOrder(order.id)}>View</Button>
      
      {/* Edit, Delete, Duplicate - Admin and Manager only */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <>
          <Button onClick={() => editOrder(order.id)}>Edit</Button>
          <Button onClick={() => requestDeleteOrder(order.id)}>Delete</Button>
          <Button onClick={() => duplicateOrder(order.id)}>Duplicate</Button>
        </>
      )}
      
      {/* Quick Status Updates - Admin and Manager only */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <StatusDropdown 
          status={order.status} 
          onChange={(status) => updateOrderStatus(order.id, status)} 
        />
      )}
      
      {/* Invoice Button - visible to all roles */}
      <Button onClick={() => generateInvoice(order.id)}>
        {order.hasInvoice ? 'View Invoice' : 'Generate Invoice'}
      </Button>
    </div>
  );
};
```

### Navigation Restrictions

```typescript
// Example of route protection based on role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  // Check if current user role is in allowed roles
  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to home or unauthorized page
    return <Navigate to="/" />;
  }
  
  return children;
};

// Usage in router
<Route 
  path="/analytics" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <AnalyticsPage />
    </ProtectedRoute>
  } 
/>
```

### Data Filtering

```typescript
// Example of data filtering based on role
const getOrdersForUser = async (userId, userRole) => {
  if (userRole === 'admin' || userRole === 'manager') {
    // Get all orders for admins and managers
    return await getAllOrders();
  } else {
    // Get only accessible orders for employees
    const accessibleItems = await getAccessibleItems(userId);
    return await getOrdersByAccessibleItems(accessibleItems);
  }
};
```

## Testing Considerations

1. **Test each role independently**: Create test accounts for each role and verify access
2. **Verify data filtering**: Ensure users only see data they should have access to
3. **Check UI element visibility**: Verify buttons, links, and fields appear correctly for each role
4. **Test navigation restrictions**: Ensure users cannot access unauthorized pages
5. **Verify action permissions**: Test that actions are properly restricted based on role 