'use client';

import React from 'react';
import { LayoutGrid, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SettingItem, SettingSection } from '@/components/settings';
import { useSettings } from '@/app/context/settings';
import { TableDensityOption } from '@/app/context/settings/types';

/**
 * Layout settings tab component
 */
export function LayoutTab() {
  const { settings, updateSettings } = useSettings();
  const { compactMode, defaultDashboardView, tableDensity } = settings.layout;

  // Handle compact mode toggle
  const handleCompactModeToggle = (checked: boolean) => {
    updateSettings('layout', { compactMode: checked });
  };

  // Handle default dashboard view change
  const handleDefaultDashboardChange = (value: 'orders' | 'analytics' | 'expenses') => {
    updateSettings('layout', { defaultDashboardView: value });
  };

  // Handle table density change
  const handleTableDensityChange = (value: TableDensityOption) => {
    updateSettings('layout', { tableDensity: value });
  };

  return (
    <SettingSection
      title="Layout Settings"
      description="Customize the layout of the application"
      icon={LayoutGrid}
      footer={
        <Button className="ml-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      }
    >
      <div className="space-y-6">
        <SettingItem
          title="Compact Mode"
          description="Use a more compact layout to fit more content on screen"
        >
          <Switch
            checked={compactMode}
            onCheckedChange={handleCompactModeToggle}
            aria-label="Toggle compact mode"
          />
        </SettingItem>

        <div>
          <h3 className="font-medium mb-2">Default Dashboard View</h3>
          <RadioGroup 
            value={defaultDashboardView} 
            onValueChange={handleDefaultDashboardChange} 
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="orders" id="orders" />
              <Label htmlFor="orders">Orders</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="analytics" id="analytics" />
              <Label htmlFor="analytics">Analytics</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expenses" id="expenses" />
              <Label htmlFor="expenses">Expenses</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <h3 className="font-medium mb-2">Table Density</h3>
          <RadioGroup 
            value={tableDensity} 
            onValueChange={handleTableDensityChange} 
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="compact-density" />
              <Label htmlFor="compact-density">Compact</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium-density" />
              <Label htmlFor="medium-density">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="relaxed" id="relaxed-density" />
              <Label htmlFor="relaxed-density">Relaxed</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </SettingSection>
  );
}
