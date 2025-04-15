import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsSectionProps } from '../types';
import { Separator } from '@/components/ui/separator';

/**
 * Component for the invoice additional content section
 *
 * Handles notes and custom text fields
 */
const AdditionalContentSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Tax & Discount Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Options */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="includeTax"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#2B2B40] p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[#D1D5DB]">
                    Include Tax
                  </FormLabel>
                  <FormDescription className="text-[#6B7280]">
                    Show tax calculation on invoice
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="taxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Enter tax rate"
                    className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Discount Options */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="includeDiscount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#2B2B40] p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[#D1D5DB]">
                    Include Discount
                  </FormLabel>
                  <FormDescription className="text-[#6B7280]">
                    Show discount calculation on invoice
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="discountRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Discount Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Enter discount rate"
                    className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator className="bg-border/40 my-4" />

      <h3 className="text-lg font-medium text-white">Additional Content</h3>
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#D1D5DB]">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes to be displayed on the invoice"
                  className="bg-transparent border-[#2B2B40] focus:border-orange-500 min-h-[100px]"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="customHeader"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#D1D5DB]">Custom Header Text (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Add custom text to the invoice header"
                  className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="customFooter"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#D1D5DB]">Custom Footer Text (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Add custom text to the invoice footer"
                  className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Payment Details section removed - now handled by PaymentDetailsSettings component */}
      </div>
    </div>
  );
};

export default AdditionalContentSection;
