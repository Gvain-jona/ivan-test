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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, FileText, StickyNote } from 'lucide-react';

/**
 * Component for the invoice additional content section
 *
 * Handles notes and custom text fields
 */
const AdditionalContentSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      {/* Tax & Discount Options */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Tax & Discount Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Options */}
            <div className="space-y-4">
              <FormField
                control={control}
                name="includeTax"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/60 p-3 bg-card/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium">
                        Include Tax
                      </FormLabel>
                      <FormDescription className="text-[#6B7280] text-xs">
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
                    <FormLabel className="text-[#D1D5DB] text-sm">Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter tax rate"
                        className="bg-transparent border-border/60 focus:border-orange-500 h-8"
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/60 p-3 bg-card/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium">
                        Include Discount
                      </FormLabel>
                      <FormDescription className="text-[#6B7280] text-xs">
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
                    <FormLabel className="text-[#D1D5DB] text-sm">Discount Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter discount rate"
                        className="bg-transparent border-border/60 focus:border-orange-500 h-8"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Content */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Additional Content</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB] text-sm">Notes</FormLabel>
                  <FormDescription className="text-[#6B7280] text-xs mb-2">
                    These notes will appear at the bottom of the invoice
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes to be displayed on the invoice"
                      className="bg-transparent border-border/60 focus:border-orange-500 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* No additional fields needed here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdditionalContentSection;
