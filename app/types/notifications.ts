export type NotificationType = 
  | 'comment' 
  | 'mention' 
  | 'invitation' 
  | 'assignment' 
  | 'status_change'
  | 'due_date'
  | 'payment';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  status: NotificationStatus;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  target: {
    id: string;
    type: 'order' | 'project' | 'task' | 'expense' | 'material';
    title: string;
  };
  actions?: {
    primary?: {
      label: string;
      action: string;
    };
    secondary?: {
      label: string;
      action: string;
    };
  };
}

export interface NotificationGroup {
  date: string; // 'today', 'yesterday', or ISO date string
  notifications: Notification[];
}
