'use client';

import React from 'react';
import { Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SettingItem, SettingSection } from '@/components/settings';
import { useSettings } from '@/app/context/settings';

/**
 * Notifications settings tab component
 */
export function NotificationsTab() {
  const { settings, updateSettings } = useSettings();
  const { enabled, emailNotifications, notificationTypes } = settings.notifications;

  // Handle notifications toggle
  const handleNotificationsToggle = (checked: boolean) => {
    updateSettings('notifications', { enabled: checked });
  };

  // Handle email notifications toggle
  const handleEmailNotificationsToggle = (checked: boolean) => {
    updateSettings('notifications', { emailNotifications: checked });
  };

  // Handle notification type toggle
  const handleNotificationTypeToggle = (type: keyof typeof notificationTypes, checked: boolean) => {
    updateSettings('notifications', {
      notificationTypes: {
        ...notificationTypes,
        [type]: checked,
      },
    });
  };

  return (
    <SettingSection
      title="Notification Preferences"
      description="Manage how you receive notifications"
      icon={Bell}
      footer={
        <Button className="ml-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      }
    >
      <div className="space-y-6">
        <SettingItem
          title="Enable Notifications"
          description="Receive notifications from the application"
        >
          <Switch
            checked={enabled}
            onCheckedChange={handleNotificationsToggle}
            aria-label="Toggle notifications"
          />
        </SettingItem>

        <SettingItem
          title="Email Notifications"
          description="Receive notifications via email"
        >
          <Switch
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationsToggle}
            disabled={!enabled}
            aria-label="Toggle email notifications"
          />
        </SettingItem>

        <div>
          <h3 className="font-medium mb-2">Notification Types</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="order-updates"
                checked={notificationTypes.orderUpdates}
                onCheckedChange={(checked) => 
                  handleNotificationTypeToggle('orderUpdates', checked as boolean)
                }
                disabled={!enabled}
              />
              <Label 
                htmlFor="order-updates" 
                className={`${!enabled ? 'text-muted-foreground' : ''}`}
              >
                Order Updates
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="expense-alerts"
                checked={notificationTypes.expenseAlerts}
                onCheckedChange={(checked) => 
                  handleNotificationTypeToggle('expenseAlerts', checked as boolean)
                }
                disabled={!enabled}
              />
              <Label 
                htmlFor="expense-alerts" 
                className={`${!enabled ? 'text-muted-foreground' : ''}`}
              >
                Expense Alerts
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="system-announcements"
                checked={notificationTypes.systemAnnouncements}
                onCheckedChange={(checked) => 
                  handleNotificationTypeToggle('systemAnnouncements', checked as boolean)
                }
                disabled={!enabled}
              />
              <Label 
                htmlFor="system-announcements" 
                className={`${!enabled ? 'text-muted-foreground' : ''}`}
              >
                System Announcements
              </Label>
            </div>
          </div>
        </div>
      </div>
    </SettingSection>
  );
}
