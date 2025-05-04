'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Save, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingSection } from '@/components/settings';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Types for role permissions
interface RolePermission {
  id: string;
  role: string;
  resource_type: string;
  resource: string;
  can_access: boolean;
}

// Group permissions by role and resource type
interface GroupedPermissions {
  [role: string]: {
    [resourceType: string]: {
      [resource: string]: RolePermission;
    };
  };
}

/**
 * Role Permissions Section Component
 */
export function RolePermissionsSection() {
  const supabase = createClientComponentClient();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Resource types, resources, and roles
  const resourceTypes = ['page', 'feature', 'action'];

  const resourcesByType = {
    page: ['dashboard', 'orders', 'expenses', 'clients', 'analytics', 'settings', 'profile', 'invoices'],
    feature: [
      'user_management', 'role_permissions', 'allowed_emails',
      'appearance_settings', 'notification_settings', 'data_privacy_settings',
      'cache_cleanup', 'export_data', 'import_data',
      'high_value_insights', 'financial_reports'
    ],
    action: [
      'create_order', 'update_order', 'delete_order',
      'create_expense', 'update_expense', 'delete_expense',
      'create_client', 'update_client', 'delete_client',
      'create_item', 'update_item', 'delete_item',
      'create_category', 'update_category', 'delete_category',
      'create_user', 'update_user', 'delete_user',
      'create_invoice', 'update_invoice', 'delete_invoice',
      'update_app_settings'
    ]
  };

  const roles = ['admin', 'manager', 'staff'];

  // Fetch permissions
  useEffect(() => {
    async function fetchPermissions() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*')
          .order('role', { ascending: true })
          .order('resource_type', { ascending: true })
          .order('resource', { ascending: true });

        if (error) throw error;

        setPermissions(data || []);

        // Group permissions by role, resource_type, and resource
        const grouped: GroupedPermissions = {};
        (data || []).forEach(permission => {
          if (!grouped[permission.role]) {
            grouped[permission.role] = {};
          }

          if (!grouped[permission.role][permission.resource_type]) {
            grouped[permission.role][permission.resource_type] = {};
          }

          grouped[permission.role][permission.resource_type][permission.resource] = permission;
        });

        setGroupedPermissions(grouped);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load permissions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();
  }, [supabase]);

  // Handle permission change
  const handlePermissionChange = (
    role: string,
    resourceType: string,
    resource: string,
    checked: boolean
  ) => {
    // Create a deep copy of the grouped permissions
    const newGroupedPermissions = JSON.parse(JSON.stringify(groupedPermissions));

    // If the role, resource type, or resource doesn't exist yet, create it
    if (!newGroupedPermissions[role]) {
      newGroupedPermissions[role] = {};
    }

    if (!newGroupedPermissions[role][resourceType]) {
      newGroupedPermissions[role][resourceType] = {};
    }

    if (!newGroupedPermissions[role][resourceType][resource]) {
      newGroupedPermissions[role][resourceType][resource] = {
        role,
        resource_type: resourceType,
        resource,
        can_access: false
      };
    }

    // Update the permission
    newGroupedPermissions[role][resourceType][resource].can_access = checked;

    // Update state
    setGroupedPermissions(newGroupedPermissions);
    setHasChanges(true);
  };

  // Save permissions
  const savePermissions = async () => {
    setIsSaving(true);
    try {
      // Convert grouped permissions back to array
      const permissionsToSave: Partial<RolePermission>[] = [];

      Object.keys(groupedPermissions).forEach(role => {
        Object.keys(groupedPermissions[role]).forEach(resourceType => {
          Object.keys(groupedPermissions[role][resourceType]).forEach(resource => {
            const permission = groupedPermissions[role][resourceType][resource];
            permissionsToSave.push({
              id: permission.id, // Include ID if it exists
              role,
              resource_type: resourceType,
              resource,
              can_access: permission.can_access
            });
          });
        });
      });

      // Upsert permissions
      const { error } = await supabase
        .from('role_permissions')
        .upsert(permissionsToSave, { onConflict: 'role,resource_type,resource' });

      if (error) throw error;

      toast.success('Permissions saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  // Get permission value
  const getPermissionValue = (role: string, resourceType: string, resource: string): boolean => {
    if (
      groupedPermissions[role] &&
      groupedPermissions[role][resourceType] &&
      groupedPermissions[role][resourceType][resource]
    ) {
      return groupedPermissions[role][resourceType][resource].can_access;
    }
    return false;
  };

  // Format resource name
  const formatResourceName = (resource: string): string => {
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/15 text-red-500 border-red-500/20';
      case 'manager':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/20';
      case 'staff':
        return 'bg-green-500/15 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <SettingSection
      title="Role Permissions"
      description="Configure what each role can access in the application"
      icon={Shield}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {resourceTypes.map(resourceType => (
            <div key={resourceType} className="space-y-4">
              <h3 className="text-lg font-medium capitalize">
                {resourceType} Permissions
              </h3>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        {resourceType === 'page' ? 'Page' :
                         resourceType === 'feature' ? 'Feature' : 'Action'}
                      </TableHead>
                      {roles.map(role => (
                        <TableHead key={role} className="text-center">
                          <Badge
                            variant="outline"
                            className={`${getRoleBadgeColor(role)} capitalize`}
                          >
                            {role}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resourcesByType[resourceType].map(resource => (
                      <TableRow key={resource}>
                        <TableCell className="font-medium">
                          {formatResourceName(resource.replace(/_/g, ' '))}
                        </TableCell>
                        {roles.map(role => (
                          <TableCell key={`${role}-${resource}`} className="text-center">
                            <Checkbox
                              id={`${role}-${resourceType}-${resource}`}
                              checked={getPermissionValue(role, resourceType, resource)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(role, resourceType, resource, checked as boolean)
                              }
                              aria-label={`${role} can access ${resource}`}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              onClick={savePermissions}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Permissions
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </SettingSection>
  );
}
