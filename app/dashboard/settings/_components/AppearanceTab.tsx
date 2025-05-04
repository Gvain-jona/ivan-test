'use client';

import React from 'react';
import { Moon, Palette, Save, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingItem, SettingSection } from '@/components/settings';
import { useSettings } from '@/app/context/settings';
import { AccentColorOption, ThemeOption } from '@/app/context/settings/types';

/**
 * Appearance settings tab component
 */
export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { accentColor, highContrast } = settings.appearance;

  // Handle theme change
  const handleThemeChange = (value: ThemeOption) => {
    setTheme(value);
    updateSettings('appearance', { theme: value });
  };

  // Handle accent color change
  const handleAccentColorChange = (value: AccentColorOption) => {
    updateSettings('appearance', { accentColor: value });
  };

  // Handle high contrast mode toggle
  const handleHighContrastChange = (checked: boolean) => {
    updateSettings('appearance', { highContrast: checked });
  };

  return (
    <SettingSection
      title="Theme Settings"
      description="Customize the appearance of the application"
      icon={Palette}
      footer={
        <Button className="ml-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Color Theme</h3>
          <RadioGroup 
            defaultValue={theme} 
            onValueChange={handleThemeChange} 
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center cursor-pointer">
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center cursor-pointer">
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Accent Color</h3>
          <Select value={accentColor} onValueChange={handleAccentColorChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="pink">Pink</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-2">
            <div className={`h-6 w-24 rounded ${
              accentColor === 'orange' ? 'bg-orange-500' : 
              accentColor === 'blue' ? 'bg-blue-500' : 
              accentColor === 'green' ? 'bg-green-500' : 
              accentColor === 'purple' ? 'bg-purple-500' : 
              'bg-pink-500'
            }`}></div>
          </div>
        </div>

        <SettingItem
          title="High Contrast Mode"
          description="Increase contrast for better visibility"
        >
          <Switch
            checked={highContrast}
            onCheckedChange={handleHighContrastChange}
            aria-label="Toggle high contrast mode"
          />
        </SettingItem>
      </div>
    </SettingSection>
  );
}
