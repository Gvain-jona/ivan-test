'use client';

import React from 'react';
import { Globe, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingSection } from '@/components/settings';
import { useSettings } from '@/app/context/settings';
import { DateFormatOption, LanguageOption, TimeFormatOption } from '@/app/context/settings/types';

/**
 * Language settings tab component
 */
export function LanguageTab() {
  const { settings, updateSettings } = useSettings();
  const { language, dateFormat, timeFormat } = settings.language;

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
    <SettingSection
      title="Language & Region"
      description="Set your preferred language and regional settings"
      icon={Globe}
      footer={
        <Button className="ml-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      }
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
  );
}
