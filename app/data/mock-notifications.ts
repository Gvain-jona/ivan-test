import { Notification, NotificationGroup } from '@/types/notifications';
import { addDays, format, subDays } from 'date-fns';

// Helper to create ISO strings for dates
const today = new Date();
const yesterday = subDays(today, 1);
const twoDaysAgo = subDays(today, 2);
const threeDaysAgo = subDays(today, 3);

// Create a set of mock notifications
export const mockNotifications: Notification[] = [
  // Today's notifications
  {
    id: 'notif-1',
    type: 'comment',
    title: 'New comment on order',
    message: 'Great work on the last update! The new features are exactly what we needed.',
    timestamp: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
    status: 'unread',
    sender: {
      id: 'user-1',
      name: 'John Smith',
      avatar: '/avatars/john.jpg',
    },
    target: {
      id: 'order-123',
      type: 'order',
      title: 'Business Cards Order',
    },
  },
  {
    id: 'notif-2',
    type: 'status_change',
    title: 'Order status updated',
    message: 'Order #ORD-456 has been marked as "In Production"',
    timestamp: new Date(today.setHours(10, 15, 0, 0)).toISOString(),
    status: 'unread',
    sender: {
      id: 'user-2',
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
    },
    target: {
      id: 'order-456',
      type: 'order',
      title: 'Brochure Printing',
    },
  },
  {
    id: 'notif-3',
    type: 'assignment',
    title: 'Task assigned to you',
    message: 'You have been assigned to complete the design review',
    timestamp: new Date(today.setHours(9, 30, 0, 0)).toISOString(),
    status: 'unread',
    sender: {
      id: 'user-3',
      name: 'Michael Brown',
      avatar: '/avatars/michael.jpg',
    },
    target: {
      id: 'task-789',
      type: 'task',
      title: 'Design Review',
    },
    actions: {
      primary: {
        label: 'Accept',
        action: 'accept_task',
      },
      secondary: {
        label: 'Decline',
        action: 'decline_task',
      },
    },
  },
  
  // Yesterday's notifications
  {
    id: 'notif-4',
    type: 'invitation',
    title: 'Project invitation',
    message: 'You have been invited to collaborate on a new project',
    timestamp: new Date(yesterday.setHours(14, 45, 0, 0)).toISOString(),
    status: 'unread',
    sender: {
      id: 'user-4',
      name: 'Emily Davis',
      avatar: '/avatars/emily.jpg',
    },
    target: {
      id: 'project-101',
      type: 'project',
      title: 'Website Redesign',
    },
    actions: {
      primary: {
        label: 'Accept',
        action: 'accept_invitation',
      },
      secondary: {
        label: 'Decline',
        action: 'decline_invitation',
      },
    },
  },
  {
    id: 'notif-5',
    type: 'payment',
    title: 'Payment received',
    message: 'Payment of UGX 750,000 has been received for order #ORD-789',
    timestamp: new Date(yesterday.setHours(11, 20, 0, 0)).toISOString(),
    status: 'read',
    sender: {
      id: 'user-5',
      name: 'Robert Wilson',
      avatar: '/avatars/robert.jpg',
    },
    target: {
      id: 'order-789',
      type: 'order',
      title: 'Banner Printing',
    },
  },
  
  // Older notifications
  {
    id: 'notif-6',
    type: 'due_date',
    title: 'Task due soon',
    message: 'The task "Finalize Invoice" is due in 2 days',
    timestamp: new Date(twoDaysAgo.setHours(15, 10, 0, 0)).toISOString(),
    status: 'read',
    sender: {
      id: 'system',
      name: 'System',
    },
    target: {
      id: 'task-456',
      type: 'task',
      title: 'Finalize Invoice',
    },
  },
  {
    id: 'notif-7',
    type: 'mention',
    title: 'You were mentioned',
    message: '@JamesWilson mentioned you in a comment: "Can you help with this design issue?"',
    timestamp: new Date(twoDaysAgo.setHours(9, 5, 0, 0)).toISOString(),
    status: 'archived',
    sender: {
      id: 'user-6',
      name: 'James Wilson',
      avatar: '/avatars/james.jpg',
    },
    target: {
      id: 'task-222',
      type: 'task',
      title: 'Logo Design',
    },
  },
  {
    id: 'notif-8',
    type: 'status_change',
    title: 'Order completed',
    message: 'Order #ORD-333 has been marked as "Completed"',
    timestamp: new Date(threeDaysAgo.setHours(16, 30, 0, 0)).toISOString(),
    status: 'archived',
    sender: {
      id: 'user-7',
      name: 'Lisa Thompson',
      avatar: '/avatars/lisa.jpg',
    },
    target: {
      id: 'order-333',
      type: 'order',
      title: 'Flyer Printing',
    },
  },
];

// Helper function to group notifications by date
export function groupNotificationsByDate(notifications: Notification[]): NotificationGroup[] {
  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    let groupKey: string;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = format(date, 'MMMM d, yyyy');
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(notification);
  });
  
  // Convert the groups object to an array of NotificationGroup
  return Object.entries(groups).map(([date, notifications]) => ({
    date,
    notifications: notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  })).sort((a, b) => {
    if (a.date === 'Today') return -1;
    if (b.date === 'Today') return 1;
    if (a.date === 'Yesterday') return -1;
    if (b.date === 'Yesterday') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// Get notifications by status
export function getNotificationsByStatus(status: 'unread' | 'read' | 'archived'): Notification[] {
  return mockNotifications.filter(notification => notification.status === status);
}

// Count unread notifications
export function getUnreadCount(): number {
  return mockNotifications.filter(notification => notification.status === 'unread').length;
}
