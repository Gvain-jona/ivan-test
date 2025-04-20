import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Check } from 'lucide-react';
import { InvoiceSettings } from './types';
import { useInvoiceSettings } from './hooks/useInvoiceSettings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface SaveSettingsButtonProps {
  settings: InvoiceSettings;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * Button component for saving invoice settings
 */
const SaveSettingsButton: React.FC<SaveSettingsButtonProps> = ({
  settings,
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settingName, setSettingName] = useState('Default');
  const [isDefault, setIsDefault] = useState(true);

  const { saveSettings } = useInvoiceSettings();

  const handleSaveClick = () => {
    setIsDialogOpen(true);
    setSettingName('Default');
    setIsDefault(true);
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const result = await saveSettings(settings, settingName, isDefault);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => {
          setIsDialogOpen(false);
          setSaveSuccess(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleSaveClick}
      >
        <Save className="h-4 w-4 mr-2" />
        Save Settings
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle>Save Invoice Settings</DialogTitle>
            <DialogDescription>
              Save your current invoice settings for future use.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={settingName}
                onChange={(e) => setSettingName(e.target.value)}
                className="col-span-3 bg-transparent border-border"
                placeholder="Enter a name for these settings"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default" className="text-right">
                Default
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked === true)}
                  className="data-[state=checked]:bg-orange-500"
                />
                <Label htmlFor="default" className="text-sm font-normal">
                  Use as default settings
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving || saveSuccess}
              className={saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SaveSettingsButton;
