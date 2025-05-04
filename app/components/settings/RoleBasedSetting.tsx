'use client';

import React from 'react';
import { useAuth } from '@/app/context/auth-context';

interface RoleBasedSettingProps {
  requiredRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders content based on user role
 */
export function RoleBasedSetting({ 
  requiredRoles, 
  children, 
  fallback = null 
}: RoleBasedSettingProps) {
  const { profile } = useAuth();
  
  if (!profile) {
    return fallback;
  }
  
  const hasAccess = requiredRoles.includes(profile.role);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
