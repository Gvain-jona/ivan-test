# Loading States and Error Handling Patterns

## Overview
This document outlines the standard loading states and error handling patterns used throughout the Ivan Prints Business Management System. Consistent loading states and error handling improve user experience by providing clear feedback during data operations.

## Loading State Patterns

### When to Use Spinners vs. Skeletons
- **Spinners**: Used for process-based operations where progress is undetermined
  - Page navigation
  - Form submissions
  - Tab switching
  - Modal opening/closing
  - Button click actions (e.g., "Mark Complete")
- **Skeletons**: Used for content-based loading where layout is known
  - Table rows
  - Cards
  - Forms with known fields
  - Dashboard widgets
  - Lists

### Spinner Specifications
- **Full Page Spinner**:
  - When: Initial page load
  - Style: Centered spinner with semi-transparent overlay
  - Size: 60px × 60px
  - Color: Primary green (#27AE60)
  - Z-index: 1000 (above all content)
  - Animation: Rotating circle, 1.5 seconds per rotation
  
- **Component Spinner**:
  - When: Tab switching, component-specific reloading
  - Style: Centered in component area
  - Size: 40px × 40px
  - Color: Primary green (#27AE60)
  - Z-index: Component + 10
  - Animation: Rotating circle, 1.5 seconds per rotation
  
- **Button Spinner**:
  - When: Button action in progress
  - Style: Inline with button text or replacing button text
  - Size: 16px × 16px
  - Color: White (#FFFFFF) on colored buttons, Primary green on white buttons
  - Animation: Rotating circle, 1 second per rotation

### Skeleton Specifications
- **Table Row Skeletons**:
  - When: Table data loading
  - Style: Gray rectangles (rounded corners) for each cell
  - Color: Light gray (#F2F2F2) with pulse animation
  - Count: 
    - Desktop (>1200px): 10 rows
    - Mobile/Small Screens (<1200px): 3 rows
  - Animation: Pulse effect (opacity 0.5 to 0.8), 1.5 seconds per cycle
  
- **Card Skeletons**:
  - When: Card data loading
  - Style: Gray rectangle with areas for title, content, actions
  - Color: Light gray (#F2F2F2) with pulse animation
  - Count: Same as table rows (10 desktop, 3 mobile)
  - Animation: Pulse effect, 1.5 seconds per cycle
  
- **Form Field Skeletons**:
  - When: Form field data loading (e.g., dropdown options)
  - Style: Gray rectangle matching field dimensions
  - Color: Light gray (#F2F2F2) with pulse animation
  - Animation: Pulse effect, 1.5 seconds per cycle

## Error Handling Patterns

### Toast Notifications
- **Purpose**: Alert users of system-level errors or operation results
- **Types**:
  - **Error Toasts**:
    - Background: Red (#E74C3C)
    - Icon: Exclamation mark
    - Position: Top-right corner
    - Duration: 5 seconds (configurable in Settings)
    - Examples: "Failed to load orders", "Network error", "Server not responding"
  - **Success Toasts**:
    - Background: Green (#27AE60)
    - Icon: Checkmark
    - Position: Top-right corner
    - Duration: 3 seconds
    - Examples: "Order saved successfully", "Task marked complete"
  - **Warning Toasts**:
    - Background: Orange (#F39C12)
    - Icon: Warning triangle
    - Position: Top-right corner
    - Duration: 4 seconds
    - Examples: "You have unsaved changes", "Session expiring soon"
- **Behavior**:
  - Stack vertically (newest at top)
  - Maximum 3 visible at once
  - Auto-dismiss after duration
  - Manual dismiss with "×" button
  - Hover pauses auto-dismiss timer

### Inline Form Errors
- **Purpose**: Validate form inputs and provide field-specific feedback
- **Placement**: Directly below the input field
- **Style**:
  - Text color: Red (#E74C3C)
  - Font size: 12px (0.75rem)
  - Font weight: Regular
  - Margin: 4px top margin from input
  - Icon: Small exclamation mark (optional)
- **Timing**: Show immediately after field blur or form submission
- **Examples**:
  - "Client name is required"
  - "Must be a positive number"
  - "Invalid email format"
  - "Password must be at least 8 characters"
- **Behavior**:
  - Field highlight: Red border around invalid field
  - Clear on valid input
  - Remain visible until fixed

### Empty States
- **Purpose**: Provide context when no data is available
- **Style**:
  - Centered in content area
  - Illustration: Simple, relevant graphic
  - Text: Clear explanation
  - Action button (when applicable)
- **Examples**:
  - Orders table: "No orders found. Add your first order to get started." + "Add Order" button
  - Tasks cards: "No tasks found. Your task list is empty." + "Add Task" button
  - Search results: "No results match your search. Try different keywords."

### Form Submission Errors
- **Purpose**: Handle errors during form submission
- **Types**:
  - **Validation Errors**: Display inline errors for each invalid field + form-level toast
  - **Server Errors**: Display toast with error message + keep form open with data preserved
  - **Network Errors**: Display toast with retry option
- **Behavior**:
  - Scroll to first error field
  - Highlight all error fields
  - Show summary at top for complex forms (optional)
  - Preserve user input on error

## Implementation Guidelines

### Loading State Implementation
```typescript
// Component example with skeleton loader
function OrdersList() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    fetchOrders()
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        showToast('error', 'Failed to load orders');
      });
  }, []);
  
  return (
    <div className="orders-list">
      {loading ? (
        // Skeleton loader
        <TableSkeleton rows={window.innerWidth > 1200 ? 10 : 3} />
      ) : (
        // Actual content
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
```

### Error Handling Implementation
```typescript
// Toast notification system
function showToast(type, message, duration) {
  const defaultDurations = {
    error: 5000,
    success: 3000,
    warning: 4000
  };
  
  const toast = {
    id: generateId(),
    type,
    message,
    duration: duration || defaultDurations[type]
  };
  
  dispatchToastAction({ type: 'ADD_TOAST', toast });
  
  // Auto-dismiss after duration
  setTimeout(() => {
    dispatchToastAction({ type: 'REMOVE_TOAST', id: toast.id });
  }, toast.duration);
}

// Form with inline errors
function OrderForm() {
  const [form, setForm] = useState({ clientName: '', items: [] });
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.clientName) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (form.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Show spinner on button
      setSubmitting(true);
      
      saveOrder(form)
        .then(() => {
          showToast('success', 'Order saved successfully');
          resetForm();
        })
        .catch(error => {
          showToast('error', 'Failed to save order');
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Client Name</label>
        <input 
          type="text"
          value={form.clientName}
          onChange={(e) => setForm({...form, clientName: e.target.value})}
          className={errors.clientName ? 'input-error' : ''}
        />
        {errors.clientName && (
          <div className="error-message">{errors.clientName}</div>
        )}
      </div>
      
      {/* Other form fields */}
      
      <button type="submit" disabled={submitting}>
        {submitting ? <ButtonSpinner /> : 'Save Order'}
      </button>
    </form>
  );
}
```

## Accessibility Considerations
1. Spinners should include appropriate ARIA attributes (`role="status"`, `aria-live="polite"`)
2. Error messages should be linked to form controls with `aria-describedby`
3. Toast notifications should have appropriate ARIA live regions
4. Color should not be the only indicator of errors (use icons and text)
5. Focus should move to the first error field after validation

## Mobile Adaptations
1. Toast notifications appear at bottom of screen on mobile
2. Smaller spinner sizes (40px full page, 30px component, 14px button)
3. Inline errors should wrap properly on small screens
4. Empty states should be compact but remain informative 