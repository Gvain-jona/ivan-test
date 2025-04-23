import { User } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';

export type Role = 'admin' | 'manager' | 'staff';

export interface AuthorizationResult {
  authorized: boolean;
  role?: Role;
  error?: string;
}

/**
 * Check if an email is authorized to access the application
 */
export async function isAuthorizedEmail(email: string): Promise<AuthorizationResult> {
  try {
    const supabase = createClient();
    
    const { data: allowedEmail, error } = await supabase
      .from('allowed_emails')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking email authorization:', error);
      return { 
        authorized: false, 
        error: 'Failed to check email authorization'
      };
    }

    if (!allowedEmail) {
      return { 
        authorized: false, 
        error: 'Email not authorized'
      };
    }

    // Validate role is one of the allowed values
    const role = (allowedEmail.role === 'admin' || 
                 allowedEmail.role === 'manager' || 
                 allowedEmail.role === 'staff') 
      ? allowedEmail.role as Role
      : 'staff';

    return { 
      authorized: true, 
      role 
    };
  } catch (error) {
    console.error('Exception in isAuthorizedEmail:', error);
    return { 
      authorized: false, 
      error: 'Internal server error checking authorization'
    };
  }
}

/**
 * Check user access and return their authorization status and role
 */
export async function checkUserAccess(user: User | null): Promise<AuthorizationResult> {
  if (!user?.email) {
    return { 
      authorized: false, 
      error: 'No user email available'
    };
  }

  return isAuthorizedEmail(user.email);
}

/**
 * Get permissions for a given role
 */
export function getRolePermissions(role: Role): string[] {
  const basePermissions = ['view_profile', 'edit_profile'];
  
  switch (role) {
    case 'admin':
      return [
        ...basePermissions,
        'manage_users',
        'view_all_orders',
        'manage_settings'
      ];
    case 'manager':
      return [
        ...basePermissions,
        'view_all_orders',
        'manage_orders'
      ];
    case 'staff':
      return [
        ...basePermissions,
        'view_assigned_orders'
      ];
    default:
      return basePermissions;
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}
