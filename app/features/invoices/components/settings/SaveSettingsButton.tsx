'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Check } from 'lucide-react';
import { useInvoiceContext } from '../../context/InvoiceContext';
import { useInvoiceSettings } from '../../hooks/useInvoiceSettingsV2';
import { useToast } from '@/components/ui/use-toast';
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

interface SaveSettingsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Button component for saving invoice settings
 */
const SaveSettingsButton: React.FC<SaveSettingsButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const { settings } = useInvoiceContext();
  const { saveSettings } = useInvoiceSettings();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingName, setSettingName] = useState('Default Settings');
  const [isDefault, setIsDefault] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await saveSettings(settings, settingName, isDefault);

      // Show success state
      setShowSuccess(true);
      
      // Close dialog after a short delay to show success
      setTimeout(() => {
        setOpen(false);
        setShowSuccess(false);
        setSettingName('Default Settings');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving settings:', error);

      // Handle user not authenticated error
      if (error.message === 'User not authenticated') {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to save your invoice settings.',
          variant: 'destructive',
        });
      } else {
        // The error message already includes details from the API
        // No need to show another toast since the hook already shows one
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 ${className}`}
        >
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
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
            <Label htmlFor="is-default">Set as default settings</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || showSuccess}
            className={showSuccess ? 'bg-green-600 hover:bg-green-600' : ''}
          >
            {showSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved Successfully!
              </>
            ) : isSaving ? (
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
  );
};

export default SaveSettingsButton;
