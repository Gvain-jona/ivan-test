'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Permission {
  role: string;
  resource_type: string;
  resource: string;
  can_access: boolean;
}

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { profile } = useAuth();
  const supabase = createClientComponentClient();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch permissions for the user's role
  useEffect(() => {
    async function fetchPermissions() {
      if (!profile?.role) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', profile.role);
        
        if (error) throw error;
        
        setPermissions(data || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPermissions();
  }, [profile?.role, supabase]);
  
  /**
   * Check if the user has permission to access a resource
   * @param resourceType The type of resource (page, feature, action)
   * @param resource The resource to check
   * @returns Whether the user has permission to access the resource
   */
  const hasPermission = (resourceType: string, resource: string): boolean => {
    // Admin always has permission
    if (profile?.role === 'admin') return true;
    
    // Check if the user has permission
    const permission = permissions.find(
      p => p.resource_type === resourceType && p.resource === resource
    );
    
    return permission?.can_access || false;
  };
  
  /**
   * Check if the user has permission to access a page
   * @param page The page to check
   * @returns Whether the user has permission to access the page
   */
  const canAccessPage = (page: string): boolean => {
    return hasPermission('page', page);
  };
  
  /**
   * Check if the user has permission to access a feature
   * @param feature The feature to check
   * @returns Whether the user has permission to access the feature
   */
  const canAccessFeature = (feature: string): boolean => {
    return hasPermission('feature', feature);
  };
  
  /**
   * Check if the user has permission to perform an action
   * @param action The action to check
   * @returns Whether the user has permission to perform the action
   */
  const canPerformAction = (action: string): boolean => {
    return hasPermission('action', action);
  };
  
  return {
    isLoading,
    hasPermission,
    canAccessPage,
    canAccessFeature,
    canPerformAction
  };
}
