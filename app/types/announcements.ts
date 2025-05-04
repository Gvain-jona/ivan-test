/**
 * Types for announcements
 */

export type AnnouncementVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

export type AnnouncementTag = 'New' | 'Updated' | 'Important' | 'Announcement' | 'Feature' | 'Maintenance' | 'Alert' | 'Welcome';

export type AppPageLink =
  | '/dashboard'
  | '/dashboard/home'
  | '/dashboard/orders'
  | '/dashboard/expenses'
  | '/dashboard/material-purchases'
  | '/dashboard/todo'
  | '/dashboard/analytics'
  | '/dashboard/settings'
  | '/dashboard/settings/appearance'
  | '/dashboard/settings/notifications'
  | '/dashboard/settings/announcements'
  | '/dashboard/settings/data-privacy'
  | '/dashboard/settings/user-management'
  | '/dashboard/settings/profit'
  | '/dashboard/settings/accounts';

export interface Announcement {
  id: string;
  tag: AnnouncementTag;
  message: string;
  link?: AppPageLink;
  variant: AnnouncementVariant;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementFormData {
  tag: AnnouncementTag;
  message: string;
  link?: AppPageLink;
  variant: AnnouncementVariant;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

// Predefined options for dropdowns
export const ANNOUNCEMENT_TAGS: AnnouncementTag[] = [
  'New',
  'Updated',
  'Important',
  'Announcement',
  'Feature',
  'Maintenance',
  'Alert',
  'Welcome'
];

export const APP_PAGE_LINKS: { label: string; value: AppPageLink }[] = [
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Home', value: '/dashboard/home' },
  { label: 'Orders', value: '/dashboard/orders' },
  { label: 'Expenses', value: '/dashboard/expenses' },
  { label: 'Material Purchases', value: '/dashboard/material-purchases' },
  { label: 'To-Do', value: '/dashboard/todo' },
  { label: 'Analytics', value: '/dashboard/analytics' },
  { label: 'Settings', value: '/dashboard/settings' },
  { label: 'Appearance Settings', value: '/dashboard/settings/appearance' },
  { label: 'Notifications Settings', value: '/dashboard/settings/notifications' },
  { label: 'Announcements Settings', value: '/dashboard/settings/announcements' },
  { label: 'Data Privacy Settings', value: '/dashboard/settings/data-privacy' },
  { label: 'User Management', value: '/dashboard/settings/user-management' },
  { label: 'Profit Settings', value: '/dashboard/settings/profit' },
  { label: 'Accounts Settings', value: '/dashboard/settings/accounts' }
];
