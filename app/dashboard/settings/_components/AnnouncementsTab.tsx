'use client';

import { useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/app/lib/api-endpoints';
import { Announcement, APP_PAGE_LINKS } from '@/app/types/announcements';
import { AnnouncementForm } from './AnnouncementForm';
import { formatDate } from '@/lib/utils';
import { useAnnouncement } from '@/app/context/announcement-context';

/**
 * Announcements tab component for settings page
 */
export function AnnouncementsTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Use the announcement context
  const {
    activeAnnouncements: announcements,
    refreshAnnouncements: fetchAnnouncements,
    isLoading
  } = useAnnouncement();

  // Handle create/edit announcement
  const handleSaveAnnouncement = async (formData: any) => {
    try {
      const isEditing = !!editingAnnouncement;
      const method = isEditing ? 'PUT' : 'POST';
      const url = API_ENDPOINTS.ANNOUNCEMENTS;

      // Prepare the announcement data
      const announcementData = {
        ...formData,
        // If editing, include the ID
        ...(isEditing && editingAnnouncement ? { id: editingAnnouncement.id } : {}),
        // Convert dates to ISO strings for the API or null if not provided
        start_date: formData.start_date ? formData.start_date.toISOString() : null,
        end_date: formData.end_date ? formData.end_date.toISOString() : null,
      };

      console.log('Saving announcement data:', announcementData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });

      // Get the response data to check for error messages
      const responseData = await response.json();

      if (!response.ok) {
        // Extract error message from response if available
        const errorMessage = responseData.error || `Failed to ${isEditing ? 'update' : 'create'} announcement`;
        throw new Error(errorMessage);
      }

      // Immediately refresh announcements to show the changes
      await fetchAnnouncements();

      // Close form and reset editing state
      setIsFormOpen(false);
      setEditingAnnouncement(null);

      // Show success toast
      toast({
        title: 'Success',
        description: `Announcement ${isEditing ? 'updated' : 'created'} successfully.`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      setIsDeleting(id);

      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      // Refresh announcements
      await fetchAnnouncements();

      // Show success toast
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle edit announcement
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  // Get variant badge color
  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/15 text-green-500 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
      case 'destructive':
        return 'bg-red-500/15 text-red-500 border-red-500/30';
      case 'info':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
      case 'secondary':
        return 'bg-purple-500/15 text-purple-500 border-purple-500/30';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Manage announcements displayed in the top header.
          </p>
        </div>
        <Button onClick={() => {
          setEditingAnnouncement(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <Separator className="my-4" />

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</CardTitle>
            <CardDescription>
              {editingAnnouncement
                ? 'Update the announcement details below.'
                : 'Fill in the details to create a new announcement.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnnouncementForm
              announcement={editingAnnouncement}
              onSave={handleSaveAnnouncement}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingAnnouncement(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-24">
                <p className="text-muted-foreground">Loading announcements...</p>
              </div>
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No announcements found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first announcement
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_active ? 'border-primary/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{announcement.tag}</CardTitle>
                    <Badge
                      variant={announcement.is_active ? 'default' : 'outline'}
                      className={announcement.is_active ? '' : 'text-muted-foreground'}
                    >
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getVariantColor(announcement.variant)}
                    >
                      {announcement.variant}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      disabled={isDeleting === announcement.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="mt-1">
                  {announcement.message}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Link:</span>
                    {announcement.link ? (
                      <span className="font-mono text-xs">
                        {APP_PAGE_LINKS.find(link => link.value === announcement.link)?.label || announcement.link}
                        <span className="text-muted-foreground ml-1">({announcement.link})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Active period:</span>
                    <span>
                      {announcement.start_date ? formatDate(announcement.start_date) : 'Always'}
                      {' - '}
                      {announcement.end_date ? formatDate(announcement.end_date) : 'No end date'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(announcement.created_at)}
                  {announcement.created_at !== announcement.updated_at &&
                    ` • Updated ${formatDate(announcement.updated_at)}`}
                </p>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
