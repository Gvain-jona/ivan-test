# Frontend Documentation

## Overview
This document outlines the frontend architecture and implementation details for the Ivan Prints Business Management System. The frontend is built using Next.js 14 with App Router, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: shadcn/ui
- **Icons**: Lucide Icons
- **Charts**: Recharts
- **Date/Time**: Day.js
- **Animations**: Framer Motion
- **Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── orders/           # Order management components
│   ├── tasks/            # Task management components
│   ├── ui/               # UI components (shadcn/ui)
│   └── shared/           # Shared components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
│   ├── api/             # API client and utilities
│   ├── auth/            # Authentication utilities
│   ├── store/           # Zustand store
│   ├── utils/           # Helper functions
│   └── validations/     # Zod schemas
├── styles/              # Global styles and Tailwind config
└── types/               # TypeScript type definitions
```

## Component Architecture

### Layout Components
- **RootLayout**: Base layout with providers and global styles
- **AuthLayout**: Layout for authentication pages
- **DashboardLayout**: Layout for protected dashboard pages
  - Sidebar navigation
  - Top navigation bar
  - User menu
  - Notifications panel

### Authentication Components
- **LoginForm**: PIN-based login form
- **DeviceVerification**: Device verification form
- **SessionProvider**: Authentication state provider
- **AuthGuard**: Protected route wrapper

### Dashboard Components
- **DashboardHeader**: Page header with actions
- **DashboardStats**: Key metrics display
- **RecentActivity**: Activity feed
- **QuickActions**: Common action buttons

### Order Management
- **OrderList**: Orders table with filters
- **OrderForm**: Create/edit order form
- **OrderDetails**: Order details view
- **OrderStatusFlow**: Order status management
- **PaymentRecorder**: Payment recording form

### Task Management
- **TaskList**: Tasks table with filters
- **TaskForm**: Create/edit task form
- **TaskBoard**: Kanban board view
- **TaskCalendar**: Calendar view

### Shared Components
- **DataTable**: Reusable table component
- **FilterBar**: Search and filter controls
- **Modal**: Modal dialog component
- **Toast**: Notification toast
- **Pagination**: Table pagination
- **LoadingSpinner**: Loading indicator
- **ErrorBoundary**: Error handling wrapper

## State Management

### Authentication Store
```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyDevice: (code: string) => Promise<void>;
}
```

### UI Store
```typescript
interface UIStore {
  isSidebarOpen: boolean;
  isNotificationsPanelOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  toggleNotificationsPanel: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### Data Fetching
Using TanStack Query for server state management:
```typescript
// Orders hooks
const useOrders = (filters: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
  });
};

const useCreateOrder = () => {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Tasks hooks
const useTasks = (filters: TaskFilters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });
};

// Real-time subscriptions
const useOrderUpdates = (orderId: string) => {
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    const subscription = supabase
      .from('orders')
      .on('UPDATE', (payload) => {
        if (payload.new.id === orderId) {
          queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);
};
```

## Form Handling
Using React Hook Form with Zod validation:
```typescript
// Order form schema
const orderSchema = z.object({
  client_id: z.string().uuid(),
  items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    profit_amount: z.number().min(0),
    labor_amount: z.number().min(0),
  })).min(1),
  notes: z.array(z.string()),
});

// Order form hook
const useOrderForm = () => {
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      items: [],
      notes: [],
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    try {
      await createOrder(data);
      toast.success('Order created successfully');
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  return { form, onSubmit };
};
```

## Styling
Using Tailwind CSS with custom configuration:
```typescript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* Custom colors */ },
        secondary: { /* Custom colors */ },
      },
      spacing: {
        /* Custom spacing */ 
      },
      animation: {
        /* Custom animations */
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

## Error Handling
```typescript
// Global error boundary
const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
};

// API error handling
const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        toast.error('Session expired. Please login again.');
        router.push('/login');
        break;
      case 'FORBIDDEN':
        toast.error('You do not have permission to perform this action.');
        break;
      default:
        toast.error(error.message);
    }
  } else {
    toast.error('An unexpected error occurred.');
    console.error(error);
  }
};
```

## Performance Optimization
1. **Code Splitting**
   - Route-based code splitting
   - Dynamic imports for heavy components
   - Lazy loading for off-screen content

2. **Image Optimization**
   - Next.js Image component
   - WebP format with fallbacks
   - Responsive images

3. **Caching Strategy**
   - TanStack Query caching
   - Static page generation where possible
   - Service worker for offline support

4. **Bundle Size Optimization**
   - Tree shaking
   - Component-level code splitting
   - Dependency optimization

## Testing
```typescript
// Component testing
describe('OrderForm', () => {
  it('validates required fields', async () => {
    render(<OrderForm />);
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Client is required')).toBeInTheDocument();
  });

  it('calculates total amount correctly', () => {
    render(<OrderForm />);
    // Add test items
    const total = screen.getByText(/total:/i);
    expect(total).toHaveTextContent('$100.00');
  });
});

// E2E testing
test('create new order flow', async ({ page }) => {
  await page.goto('/orders/new');
  await page.fill('[name="client_id"]', 'Test Client');
  await page.click('button[type="submit"]');
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

## Accessibility
1. **ARIA Attributes**
   - Proper roles and labels
   - Focus management
   - Screen reader support

2. **Keyboard Navigation**
   - Focus trapping in modals
   - Skip links
   - Keyboard shortcuts

3. **Color Contrast**
   - WCAG 2.1 compliance
   - High contrast mode support

## Security
1. **Authentication**
   - Protected routes
   - Token management
   - Session expiry handling

2. **Data Protection**
   - Input sanitization
   - XSS prevention
   - CSRF protection

3. **Error Handling**
   - Safe error messages
   - Error boundaries
   - Logging

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hook Form Documentation](https://react-hook-form.com) 