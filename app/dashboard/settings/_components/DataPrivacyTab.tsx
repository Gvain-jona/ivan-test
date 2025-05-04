'use client';

import React from 'react';
import { Database, Save, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SettingItem, SettingSection, CacheCleanupCard } from '@/components/settings';
import { useSettings } from '@/app/context/settings';

/**
 * Data & Privacy settings tab component
 */
export function DataPrivacyTab() {
  const { settings, updateSettings } = useSettings();
  const { dataSync, usageDataCollection } = settings.dataPrivacy;

  // Handle data sync toggle
  const handleDataSyncToggle = (checked: boolean) => {
    updateSettings('dataPrivacy', { dataSync: checked });
  };

  // Handle usage data collection toggle
  const handleUsageDataToggle = (checked: boolean) => {
    updateSettings('dataPrivacy', { usageDataCollection: checked });
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title="Data & Privacy"
        description="Manage your data and privacy settings"
        icon={Shield}
        footer={
          <Button className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        }
      >
        <div className="space-y-6">
          <SettingItem
            title="Data Synchronization"
            description="Sync your data across devices"
          >
            <Switch
              checked={dataSync}
              onCheckedChange={handleDataSyncToggle}
              aria-label="Toggle data sync"
            />
          </SettingItem>

          <div>
            <h3 className="font-medium mb-2">Data Collection</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We collect anonymous usage data to improve our service. You can opt out at any time.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="usage-data"
                checked={usageDataCollection}
                onCheckedChange={(checked) => handleUsageDataToggle(checked as boolean)}
              />
              <Label htmlFor="usage-data">
                Allow anonymous usage data collection
              </Label>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-medium mb-2">Data Management</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="mr-2 h-4 w-4" />
                Export My Data
              </Button>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Cache Cleanup Card */}
      <CacheCleanupCard />
    </div>
  );
}
