import React from 'react';
import { 
  FormField, 
  FormItem, 
  FormControl, 
  FormLabel 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsSectionProps } from '../types';

/**
 * Component for the invoice layout settings section
 * 
 * Handles checkbox options for layout elements like header, footer, logo, and signature
 */
const InvoiceLayoutSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Invoice Layout</h3>
      
      <div className="space-y-2">
        <FormField
          control={control}
          name="includeHeader"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-orange-500"
                />
              </FormControl>
              <FormLabel className="text-[#D1D5DB] font-normal m-0 cursor-pointer">
                Include Header
              </FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="includeFooter"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-orange-500"
                />
              </FormControl>
              <FormLabel className="text-[#D1D5DB] font-normal m-0 cursor-pointer">
                Include Footer
              </FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="includeLogo"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-orange-500"
                />
              </FormControl>
              <FormLabel className="text-[#D1D5DB] font-normal m-0 cursor-pointer">
                Include Logo
              </FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="includeSignature"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-orange-500"
                />
              </FormControl>
              <FormLabel className="text-[#D1D5DB] font-normal m-0 cursor-pointer">
                Include Signature Line
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default InvoiceLayoutSection;
