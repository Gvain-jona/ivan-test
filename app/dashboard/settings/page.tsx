'use client';

import { Suspense } from 'react';
import {
  CogIcon,
  Bell,
  Palette,
  Users,
  Calculator,
  Wallet,
  Megaphone
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AppearanceLayoutTab,
  NotificationsTab,
  UserManagementTab,
  ProfitSettingsTab,
  AccountsSettingsTab,
  AnnouncementsTab
} from './_components';

/**
 * Loading component for settings tabs
 */
function TabLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[200px] w-full rounded-lg" />
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </div>
  );
}

/**
 * Settings page component
 */
export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <CogIcon className="h-8 w-8 mr-3 text-orange-500" />
        <h1 className="text-3xl font-bold">App Settings</h1>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span>Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Profit Settings</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>Accounts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Suspense fallback={<TabLoading />}>
            <AppearanceLayoutTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Suspense fallback={<TabLoading />}>
            <NotificationsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Suspense fallback={<TabLoading />}>
            <AnnouncementsTab />
          </Suspense>
        </TabsContent>


        <TabsContent value="users" className="space-y-6">
          <Suspense fallback={<TabLoading />}>
            <UserManagementTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <Suspense fallback={<TabLoading />}>
            <ProfitSettingsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Suspense fallback={<TabLoading />}>
            <AccountsSettingsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}