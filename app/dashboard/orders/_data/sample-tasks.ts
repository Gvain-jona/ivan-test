import { Task } from '@/types/orders';

/**
 * Sample tasks data for development
 */
export const SAMPLE_TASKS: Task[] = [
  {
    id: 'task1',
    title: 'Follow up on Acme Corp order',
    description: 'Call John for payment balance',
    due_date: '2024-04-10',
    priority: 'high',
    status: 'pending',
    linked_item_type: 'order',
    linked_item_id: 'ORD00123',
    recurring: false,
    assigned_to: 'user1',
    assigned_to_name: 'Alex Johnson',
    created_by: 'user1',
    created_at: '2024-03-17T10:30:00Z',
    updated_at: '2024-03-17T10:30:00Z',
    linked_order_number: 'ORD00123'
  },
  {
    id: 'task2',
    title: 'Prepare artwork for TechStart brochures',
    description: 'Use the new brand guidelines',
    due_date: '2024-04-05',
    priority: 'medium',
    status: 'in_progress',
    linked_item_type: 'order',
    linked_item_id: 'ORD00124',
    recurring: false,
    assigned_to: 'user2',
    assigned_to_name: 'Sarah Williams',
    created_by: 'user1',
    created_at: '2024-03-21T09:15:00Z',
    updated_at: '2024-03-22T14:20:00Z',
    linked_order_number: 'ORD00124'
  },
  {
    id: 'task3',
    title: 'Quote for additional menu items',
    description: 'Local Restaurant needs pricing for holiday menu items',
    due_date: '2024-04-02',
    priority: 'low',
    status: 'pending',
    linked_item_type: 'order',
    linked_item_id: 'ORD00125',
    recurring: false,
    assigned_to: 'user1',
    assigned_to_name: 'Alex Johnson',
    created_by: 'user1',
    created_at: '2024-03-28T10:00:00Z',
    updated_at: '2024-03-28T10:00:00Z',
    linked_order_number: 'ORD00125'
  }
]; 