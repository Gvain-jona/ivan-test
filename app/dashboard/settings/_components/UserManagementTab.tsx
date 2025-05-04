'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Save, Trash2, Edit, Check, X, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SettingSection } from '@/components/settings';
import { RolePermissionsSection } from './RolePermissionsSection';
import { useAuth } from '@/app/context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Types for user management
interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface AllowedEmail {
  id: string;
  email: string;
  created_at: string;
}

/**
 * User Management tab component
 * Only accessible to admins
 */
export function UserManagementTab() {
  const { isAdmin } = useAuth();
  const supabase = createClientComponentClient();

  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for new user form
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // State for editing user
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');

  // Fetch users and allowed emails
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        // Fetch profiles with last_sign_in_at
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role, created_at, last_sign_in_at')
          .order('created_at', { ascending: false });

        // Fetch allowed emails
        const { data: emails, error: emailsError } = await supabase
          .from('allowed_emails')
          .select('*')
          .order('created_at', { ascending: false });

        if (emailsError) throw emailsError;

        setUsers(profiles || []);
        setAllowedEmails(emails || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      fetchUsers();
    }
  }, [supabase, isAdmin]);

  // Handle adding a new allowed email
  const handleAddAllowedEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsAddingEmail(true);

    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .insert({ email: newEmail.toLowerCase() })
        .select()
        .single();

      if (error) throw error;

      setAllowedEmails([data, ...allowedEmails]);
      setNewEmail('');
      toast.success('Email added to allowed list');
    } catch (error) {
      console.error('Error adding allowed email:', error);
      toast.error('Failed to add email');
    } finally {
      setIsAddingEmail(false);
    }
  };

  // Handle removing an allowed email
  const handleRemoveAllowedEmail = async (id: string) => {
    try {
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAllowedEmails(allowedEmails.filter(email => email.id !== id));
      toast.success('Email removed from allowed list');
    } catch (error) {
      console.error('Error removing allowed email:', error);
      toast.error('Failed to remove email');
    }
  };

  // Handle updating user role
  const handleUpdateUserRole = async () => {
    if (!editingUser || !editRole) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: editRole })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === editingUser.id ? { ...user, role: editRole } : user
      ));

      setEditingUser(null);
      toast.success('User role updated');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  // Start editing a user
  const startEditingUser = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/15 text-red-500 border-red-500/20 hover:bg-red-500/25';
      case 'manager':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/20 hover:bg-blue-500/25';
      case 'staff':
        return 'bg-green-500/15 text-green-500 border-green-500/20 hover:bg-green-500/25';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/20 hover:bg-gray-500/25';
    }
  };

  // If not admin, show restricted access message
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Restricted Access</h3>
        <p className="text-muted-foreground">
          User management is only available to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Management Section */}
      <SettingSection
        title="User Management"
        description="Manage users and their roles"
        icon={Users}
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {editingUser?.id === user.id ? (
                            <Select value={editRole} onValueChange={setEditRole}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`${getRoleBadgeColor(user.role)} capitalize`}
                            >
                              {user.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                        <TableCell className="text-right">
                          {editingUser?.id === user.id ? (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleUpdateUserRole}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </SettingSection>

      {/* Allowed Emails Section */}
      <SettingSection
        title="Allowed Emails"
        description="Manage email addresses that are allowed to sign up"
        icon={Mail}
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddAllowedEmail}
                disabled={isAddingEmail || !newEmail}
              >
                {isAddingEmail ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Email
                  </span>
                )}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowedEmails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No allowed emails found
                      </TableCell>
                    </TableRow>
                  ) : (
                    allowedEmails.map(email => (
                      <TableRow key={email.id}>
                        <TableCell>{email.email}</TableCell>
                        <TableCell>{formatDate(email.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remove Allowed Email</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to remove {email.email} from the allowed emails list?
                                  This will prevent new users from signing up with this email address.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {}}>Cancel</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRemoveAllowedEmail(email.id)}
                                >
                                  Remove
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </SettingSection>

      {/* Role Permissions Section */}
      <RolePermissionsSection />
    </div>
  );
}
