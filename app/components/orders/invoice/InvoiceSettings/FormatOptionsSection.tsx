import React from 'react';
import { 
  FormField, 
  FormItem, 
  FormControl, 
  FormLabel 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SettingsSectionProps } from '../types';

/**
 * Component for the invoice format options section
 * 
 * Handles paper size and template selection
 */
const FormatOptionsSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Format Options</h3>
      
      <div className="space-y-4">
        <FormField
          control={control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#D1D5DB]">Paper Size</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-transparent border-[#2B2B40] focus:border-orange-500">
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-950 border-[#2B2B40]">
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">US Letter</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="template"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#D1D5DB]">Template Style</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-transparent border-[#2B2B40] focus:border-orange-500">
                    <SelectValue placeholder="Select template style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-950 border-[#2B2B40]">
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default FormatOptionsSection;
