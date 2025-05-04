'use client';

import React from 'react';
import Image from 'next/image';
import { Moon, Palette, Save, Sun, Globe, Building2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingItem, SettingSection } from '@/components/settings';
import { useSettings } from '@/app/context/settings';
import { FileUpload } from '@/components/ui/file-upload';
import {
  ThemeOption,
  LanguageOption,
  DateFormatOption,
  TimeFormatOption
} from '@/app/context/settings/types';

/**
 * Combined Appearance, Layout and Language settings tab component
 */
export function AppearanceLayoutTab() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();

  // Appearance settings
  const { companyName, companyLogo } = settings.appearance;

  // Language settings
  const { language, dateFormat, timeFormat } = settings.language;

  // Handle theme change
  const handleThemeChange = (value: ThemeOption) => {
    setTheme(value);
    updateSettings('appearance', { theme: value });
  };

  // Handle company name change
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings('appearance', { companyName: e.target.value });
  };

  // Handle company logo change
  const handleCompanyLogoChange = (url: string) => {
    updateSettings('appearance', { companyLogo: url });
  };

  // Handle language change
  const handleLanguageChange = (value: LanguageOption) => {
    updateSettings('language', { language: value });
  };

  // Handle date format change
  const handleDateFormatChange = (value: DateFormatOption) => {
    updateSettings('language', { dateFormat: value });
  };

  // Handle time format change
  const handleTimeFormatChange = (value: TimeFormatOption) => {
    updateSettings('language', { timeFormat: value });
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <SettingSection
        title="Business Information"
        description="Customize your business details"
        icon={Building2}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Company Name</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="bg-muted/30 rounded-md p-4">
                <Input
                  value={companyName}
                  onChange={handleCompanyNameChange}
                  placeholder="Enter your company name"
                  className="bg-background/80"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This name will be displayed throughout the application and on invoices.
                </p>
              </div>
              <div className="hidden md:block"></div> {/* Spacer for grid alignment */}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Company Logo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Logo Preview */}
              <div className="bg-muted/30 rounded-md p-4 flex flex-col items-center justify-center">
                <div className="w-32 h-32 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                  {companyLogo ? (
                    <Image
                      src={companyLogo}
                      alt="Company Logo"
                      width={128}
                      height={128}
                      className="object-contain"
                      onError={() => {
                        // Handle error silently
                        updateSettings('appearance', { companyLogo: '/images/default-logo.svg' });
                      }}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground text-center p-2">
                      No logo uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div>
                <FileUpload
                  value={companyLogo}
                  onChange={handleCompanyLogoChange}
                  bucketName="logos"
                  accept="image/*"
                  maxSize={2}
                  showPreview={false}
                  buttonText="Upload Logo"
                  changeButtonText="Change Logo"
                />
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div>• Maximum file size: 2MB</div>
                  <div>• Recommended dimensions: 200x200 pixels</div>
                  <div>• Transparent background (PNG) works best</div>
                  <div>• Square format is recommended</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Theme Settings */}
      <SettingSection
        title="Theme Settings"
        description="Customize the appearance of the application"
        icon={Palette}
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
        </div>
      </SettingSection>

      {/* Language Settings */}
      <SettingSection
        title="Language & Region"
        description="Set your preferred language and regional settings"
        icon={Globe}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Application Language</h3>
            <Select value={language} onValueChange={handleLanguageChange}>
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
            <RadioGroup
              value={dateFormat}
              onValueChange={handleDateFormatChange}
              className="space-y-2"
            >
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
            <RadioGroup
              value={timeFormat}
              onValueChange={handleTimeFormatChange}
              className="space-y-2"
            >
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
        </div>
      </SettingSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
