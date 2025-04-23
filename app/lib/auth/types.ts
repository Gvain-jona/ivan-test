import { User } from '@supabase/supabase-js';

// Role and Permission Types
export type Role = 'admin' | 'manager' | 'staff';

export type Permission = 
  | 'view_profile'
  | 'edit_profile'
  | 'manage_users'
  | 'view_all_orders'
  | 'manage_orders'
  | 'view_assigned_orders'
  | 'manage_settings';

// Authorization Types
export interface AuthorizationResult {
  authorized: boolean;
  role?: Role;
  error?: string;
  permissions?: Permission[];
}

export interface AuthorizedUser extends User {
  role: Role;
  permissions: Permission[];
}

// Error Monitoring Types
export interface AuthError {
  code: string;
  message: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface ErrorLog extends AuthError {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
}

// Performance Monitoring Types
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
  context?: Record<string, unknown>;
}

// Cache Types
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxEntries: number;
}

// Migration Types
export interface MigrationRecord {
  id: string;
  name: string;
  timestamp: string;
  successful: boolean;
  error?: string;
}

// Profile Types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  provider?: string;
}
