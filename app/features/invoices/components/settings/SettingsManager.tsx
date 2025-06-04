'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useInvoiceContext } from '../../context/InvoiceContext';
import { useInvoiceSettings } from '../../hooks/useInvoiceSettingsV2';

import { InvoiceSettingRecord } from '../../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Trash, Check, Star, StarOff } from 'lucide-react';

/**
 * Component for managing saved invoice settings
 */
const SettingsManager: React.FC = () => {
  const { settings: currentSettings, updateSettings } = useInvoiceContext();
  const { toast } = useToast();

  // State for saved settings
  const [savedSettings, setSavedSettings] = useState<InvoiceSettingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSettingId, setActiveSettingId] = useState<string | null>(null);

  // State for save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [settingName, setSettingName] = useState('Default Settings');
  const [isDefault, setIsDefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get the functions from the hook
  const { saveSettings, getAllSettings, deleteSettings, setDefaultSettings, mutate: mutateInvoiceSettings } = useInvoiceSettings();

  // Load saved settings
  useEffect(() => {
    let mounted = true; // Track if component is still mounted
    
    const loadSettings = async () => {
      if (!mounted) return;
      
      // Only load if we don't have settings yet
      if (savedSettings.length === 0) {
        setIsLoading(true);
        try {
          const settings = await getAllSettings();
          
          if (!mounted) return;
          
          // Ensure settings is an array
          const settingsArray = Array.isArray(settings) ? settings : [];
          
          // Filter out fallback settings
          const realSettings = settingsArray.filter((s: any) => 
            s && s.id !== 'default-fallback' && !s.id?.startsWith('mock-id-')
          );
          
          setSavedSettings(realSettings);
          
          // Try to determine the active setting based on current settings
          // Compare current settings with saved ones to find the active one
          const activeSettingFromCurrent = realSettings.find((savedSetting: InvoiceSettingRecord) => {
            // Check if company name matches as a simple indicator
            return savedSetting.settings.companyName === currentSettings.companyName &&
                   savedSetting.settings.companyEmail === currentSettings.companyEmail;
          });
          
          if (activeSettingFromCurrent) {
            setActiveSettingId(activeSettingFromCurrent.id);
          } else {
            // If no match, check for default
            const defaultSetting = realSettings.find((s: any) => s.is_default);
            if (defaultSetting) {
              setActiveSettingId(defaultSetting.id);
            }
          }
        } catch (error: any) {
          console.error('Error loading settings:', error);
          
          if (!mounted) return;
          
          toast({
            title: 'Error Loading Settings',
            description: 'Could not load saved settings. The database may not be available.',
            variant: 'destructive',
          });
          setSavedSettings([]);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    };

    loadSettings();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Save settings - allow multiple default settings
      const result = await saveSettings(currentSettings, settingName, isDefault);
      if (result && result.id) {
        setActiveSettingId(result.id);
      }

      // Reload settings to get the updated list
      const updatedSettings = await getAllSettings();
      const settingsArray = Array.isArray(updatedSettings) ? updatedSettings : [];
      setSavedSettings(settingsArray);

      toast({
        title: 'Settings Saved',
        description: isDefault ? 'Default settings updated successfully.' : `Invoice settings "${settingName}" have been saved successfully.`,
      });

      // If we saved as default, update the main invoice settings cache
      if (isDefault) {
        mutateInvoiceSettings();
      }

      setSaveDialogOpen(false);
      // Reset form
      setSettingName('Default Settings');
      setIsDefault(true);
    } catch (error) {
      console.error('Error saving settings:', error);

      toast({
        title: 'Error Saving Settings',
        description: 'There was an error saving your invoice settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!settingToDelete) return;

    try {
      setIsDeleting(true);

      const success = await deleteSettings(settingToDelete);

      if (success) {
        setSavedSettings(prev => prev.filter(s => s.id !== settingToDelete));
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting settings:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle load
  const handleLoad = (setting: InvoiceSettingRecord) => {
    // Update the context with the loaded settings
    Object.entries(setting.settings).forEach(([key, value]) => {
      updateSettings(key as any, value);
    });

    // Mark this as the active setting
    setActiveSettingId(setting.id);

    toast({
      title: 'Settings Loaded',
      description: `Invoice settings "${setting.name}" have been loaded successfully.`,
    });
  };

  // Handle toggle default
  const handleToggleDefault = async (setting: InvoiceSettingRecord) => {
    try {
      const newDefaultValue = !setting.is_default;
      const success = await setDefaultSettings(setting.id);

      if (success) {
        setSavedSettings(prev => prev.map(s => 
          s.id === setting.id 
            ? { ...s, is_default: newDefaultValue }
            : s
        ));
        
        // Update the main invoice settings cache
        mutateInvoiceSettings();
        
        toast({
          title: newDefaultValue ? 'Default Added' : 'Default Removed',
          description: `Settings "${setting.name}" ${newDefaultValue ? 'marked as default' : 'unmarked as default'}.`,
        });
      }
    } catch (error) {
      console.error('Error toggling default:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Saved Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Default settings are automatically loaded when creating invoices. All users see the same default settings.
          </p>
        </div>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Save className="mr-2 h-4 w-4" />
              Save Current Settings
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Invoice Settings</DialogTitle>
              <DialogDescription>
                Save your current invoice settings for future use. You can set these as your default settings.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Settings Name</Label>
                <Input
                  id="name"
                  value={settingName}
                  onChange={(e) => setSettingName(e.target.value)}
                  placeholder="e.g., Default Settings, Company A Settings"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <Label htmlFor="is-default">Mark as default (you can have multiple)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : savedSettings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No saved settings found. Save your current settings to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedSettings.map((setting) => {
            const isActive = setting.id === activeSettingId;
            return (
              <Card key={setting.id} className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
                <div className="absolute top-2 right-2 flex gap-2">
                  {setting.is_default && (
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                      Default
                    </div>
                  )}
                  {isActive && (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Active
                    </div>
                  )}
                </div>

              <CardHeader>
                <CardTitle>{setting.name}</CardTitle>
                <CardDescription>
                  Created on {new Date(setting.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Company: {setting.settings.companyName}</p>
                  <p>Logo: {setting.settings.showLogo ? 'Shown' : 'Hidden'}</p>
                  <p>Item Format: {setting.settings.itemDisplayFormat}</p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoad(setting)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Apply
                    </Button>
                  )}
                  {isActive && (
                    <div className="text-sm text-green-500 flex items-center">
                      <Check className="mr-1 h-4 w-4" />
                      Currently Applied
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleDefault(setting)}
                  >
                    {setting.is_default ? (
                      <>
                        <StarOff className="mr-2 h-4 w-4" />
                        Unmark Default
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Mark as Default
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSettingToDelete(setting.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
            );
          })}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Settings</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete these invoice settings? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsManager;
