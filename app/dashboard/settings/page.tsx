'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  CogIcon,
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  Database,
  LayoutGrid,
  Palette,
  Save,
  Trash2
} from 'lucide-react';
import { CacheCleanupCard } from '@/components/settings/CacheCleanupCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('english');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [accentColor, setAccentColor] = useState('orange');

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <CogIcon className="h-8 w-8 mr-3 text-orange-500" />
        <h1 className="text-3xl font-bold">App Settings</h1>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Language</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Data & Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span>Layout</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Color Theme</h3>
                  <RadioGroup defaultValue={theme} onValueChange={setTheme} className="flex space-x-4">
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
                  <Select value={accentColor} onValueChange={setAccentColor}>
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
                    <div className={`h-6 w-24 rounded ${accentColor === 'orange' ? 'bg-orange-500' : accentColor === 'blue' ? 'bg-blue-500' : accentColor === 'green' ? 'bg-green-500' : accentColor === 'purple' ? 'bg-purple-500' : 'bg-pink-500'}`}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">High Contrast Mode</h3>
                    <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    checked={highContrast}
                    onCheckedChange={setHighContrast}
                    aria-label="Toggle high contrast mode"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications from the application</p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  aria-label="Toggle notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled={!notificationsEnabled}
                  aria-label="Toggle email notifications"
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Notification Types</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="order-updates"
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      defaultChecked
                      disabled={!notificationsEnabled}
                    />
                    <label htmlFor="order-updates" className={`${!notificationsEnabled ? 'text-muted-foreground' : ''}`}>
                      Order Updates
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="expense-alerts"
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      defaultChecked
                      disabled={!notificationsEnabled}
                    />
                    <label htmlFor="expense-alerts" className={`${!notificationsEnabled ? 'text-muted-foreground' : ''}`}>
                      Expense Alerts
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="system-announcements"
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      defaultChecked
                      disabled={!notificationsEnabled}
                    />
                    <label htmlFor="system-announcements" className={`${!notificationsEnabled ? 'text-muted-foreground' : ''}`}>
                      System Announcements
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
              <CardDescription>Set your preferred language and regional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Application Language</h3>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="russian">Russian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Date Format</h3>
                <RadioGroup defaultValue="mdy" className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mdy" id="mdy" />
                    <Label htmlFor="mdy">MM/DD/YYYY</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dmy" id="dmy" />
                    <Label htmlFor="dmy">DD/MM/YYYY</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ymd" id="ymd" />
                    <Label htmlFor="ymd">YYYY/MM/DD</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Time Format</h3>
                <RadioGroup defaultValue="12h" className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="12h" />
                    <Label htmlFor="12h">12-hour (AM/PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="24h" />
                    <Label htmlFor="24h">24-hour</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Synchronization</h3>
                  <p className="text-sm text-muted-foreground">Sync your data across devices</p>
                </div>
                <Switch
                  checked={dataSync}
                  onCheckedChange={setDataSync}
                  aria-label="Toggle data sync"
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Data Collection</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  We collect anonymous usage data to improve our service. You can opt out at any time.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usage-data"
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    defaultChecked
                  />
                  <label htmlFor="usage-data">
                    Allow anonymous usage data collection
                  </label>
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
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          {/* Cache Cleanup Card */}
          <CacheCleanupCard />
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>Customize the layout of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Compact Mode</h3>
                  <p className="text-sm text-muted-foreground">Use a more compact layout to fit more content on screen</p>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                  aria-label="Toggle compact mode"
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Default Dashboard View</h3>
                <RadioGroup defaultValue="orders" className="space-y-2">
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
                <RadioGroup defaultValue="medium" className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact" />
                    <Label htmlFor="compact">Compact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relaxed" id="relaxed" />
                    <Label htmlFor="relaxed">Relaxed</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}