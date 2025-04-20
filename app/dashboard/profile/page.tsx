'use client';

import { useState } from 'react';
import { UserIcon, Camera, Mail, Phone, ShieldCheck, Bell, Edit, Save, Lock } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',


  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // Here you would typically save the profile data to your backend
    console.log('Saving profile data:', formData);
    setIsEditing(false);
    // In a real implementation, you would update the profile in your auth context/backend
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <UserIcon className="h-8 w-8 mr-3 text-orange-500" />
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>Personal Information</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Photo */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 bg-gradient-to-r from-primary to-orange-600 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-semibold text-white">
                        {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={true} // Email is typically not editable
                          className="flex-1"
                        />
                      </div>
                    </div>


                  </div>






                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">


              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Login Sessions</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Windows • Chrome • Last active now</p>
                    </div>
                    <div className="text-sm text-green-500 font-medium">Active</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Sign Out of All Devices
                </Button>
              </div>
            </CardContent>
            <CardFooter />
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications in the app</p>
                  </div>
                  <Switch id="push-notifications" defaultChecked />
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Notification Types</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="order-updates"
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        defaultChecked
                      />
                      <label htmlFor="order-updates">
                        Order Updates
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="expense-alerts"
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        defaultChecked
                      />
                      <label htmlFor="expense-alerts">
                        Expense Alerts
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="task-reminders"
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        defaultChecked
                      />
                      <label htmlFor="task-reminders">
                        Task Reminders
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="system-announcements"
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        defaultChecked
                      />
                      <label htmlFor="system-announcements">
                        System Announcements
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Email Frequency</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="immediate"
                        name="email-frequency"
                        className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                        defaultChecked
                      />
                      <label htmlFor="immediate">
                        Immediate - Send emails as events occur
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="daily"
                        name="email-frequency"
                        className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="daily">
                        Daily Digest - Send a summary once a day
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="weekly"
                        name="email-frequency"
                        className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="weekly">
                        Weekly Digest - Send a summary once a week
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}