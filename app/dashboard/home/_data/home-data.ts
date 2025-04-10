'use client';

import { SAMPLE_ORDERS } from '../../orders/_data/sample-orders';

// Home page metrics data
export const HOME_METRICS_DATA = {
  totalOrders: 156,
  pendingOrders: 12,
  completedOrders: 144,
  revenue: 8750000, // UGX
  activeClients: 28,
  pendingTasks: 8,
  completedTasks: 42,
  totalTasks: 50,
  recentActivity: 15,
};

// Recent orders data (derived from sample orders)
export const RECENT_ORDERS = SAMPLE_ORDERS
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5);

// Upcoming tasks data
export const UPCOMING_TASKS = [
  {
    id: 'task-1',
    title: 'Follow up with Client A about payment',
    due_date: '2025-04-10',
    priority: 'high',
    status: 'pending',
    related_order_id: 'ORD-2023-001',
    assigned_to: 'John Doe',
  },
  {
    id: 'task-2',
    title: 'Prepare invoice for Order #ORD-2023-005',
    due_date: '2025-04-09',
    priority: 'medium',
    status: 'pending',
    related_order_id: 'ORD-2023-005',
    assigned_to: 'Jane Smith',
  },
  {
    id: 'task-3',
    title: 'Order materials for upcoming projects',
    due_date: '2025-04-12',
    priority: 'high',
    status: 'pending',
    related_order_id: null,
    assigned_to: 'John Doe',
  },
  {
    id: 'task-4',
    title: 'Schedule delivery for Order #ORD-2023-008',
    due_date: '2025-04-11',
    priority: 'medium',
    status: 'pending',
    related_order_id: 'ORD-2023-008',
    assigned_to: 'Jane Smith',
  },
  {
    id: 'task-5',
    title: 'Review and approve design proofs',
    due_date: '2025-04-10',
    priority: 'low',
    status: 'pending',
    related_order_id: null,
    assigned_to: 'John Doe',
  },
];

// Recent activity data
export const RECENT_ACTIVITY = [
  {
    id: 'activity-1',
    type: 'order_created',
    description: 'New order #ORD-2023-010 created',
    timestamp: '2025-04-08T10:30:00Z',
    user: 'John Doe',
    related_id: 'ORD-2023-010',
  },
  {
    id: 'activity-2',
    type: 'payment_received',
    description: 'Payment received for order #ORD-2023-005',
    timestamp: '2025-04-08T09:15:00Z',
    user: 'System',
    related_id: 'ORD-2023-005',
  },
  {
    id: 'activity-3',
    type: 'task_completed',
    description: 'Task "Prepare invoice for Order #ORD-2023-002" completed',
    timestamp: '2025-04-07T16:45:00Z',
    user: 'Jane Smith',
    related_id: 'task-2',
  },
  {
    id: 'activity-4',
    type: 'order_status_changed',
    description: 'Order #ORD-2023-003 status changed to "Completed"',
    timestamp: '2025-04-07T14:20:00Z',
    user: 'John Doe',
    related_id: 'ORD-2023-003',
  },
  {
    id: 'activity-5',
    type: 'client_added',
    description: 'New client "ABC Company" added',
    timestamp: '2025-04-07T11:10:00Z',
    user: 'Jane Smith',
    related_id: 'client-15',
  },
];

// Quick actions data
export const QUICK_ACTIONS = [
  {
    id: 'action-1',
    title: 'Create New Order',
    icon: 'Package',
    href: '/dashboard/orders?action=create',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'action-2',
    title: 'Add New Client',
    icon: 'UserPlus',
    href: '/dashboard/clients?action=create',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'action-3',
    title: 'Record Expense',
    icon: 'Receipt',
    href: '/dashboard/expenses?action=create',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'action-4',
    title: 'Add Task',
    icon: 'CheckSquare',
    href: '/dashboard/todo?action=create',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];
