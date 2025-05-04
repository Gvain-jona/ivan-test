'use client';

import React from 'react';
import { usePermissions } from '@/app/hooks/usePermissions';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  resourceType: 'page' | 'feature' | 'action';
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders content based on user permissions
 */
export function PermissionGuard({ 
  resourceType, 
  resource, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();
  
  // If still loading permissions, show nothing
  if (isLoading) {
    return null;
  }
  
  // If user has permission, show children
  if (hasPermission(resourceType, resource)) {
    return <>{children}</>;
  }
  
  // If user doesn't have permission and fallback is provided, show fallback
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Shield className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
      <p className="text-muted-foreground">
        You don't have permission to access this {resourceType}.
      </p>
    </div>
  );
}
