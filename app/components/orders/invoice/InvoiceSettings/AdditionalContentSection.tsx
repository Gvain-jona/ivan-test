import React from 'react';
import { 
  FormField, 
  FormItem, 
  FormControl, 
  FormLabel 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SettingsSectionProps } from '../types';
import { Separator } from '@/components/ui/separator';

/**
 * Component for the invoice additional content section
 * 
 * Handles notes, payment terms, and custom text fields
 */
const AdditionalContentSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-4">
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
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#D1D5DB]">Payment Terms</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Payment due within 30 days"
                  className="bg-transparent border-[#2B2B40] focus:border-orange-500"
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
        
        <Separator className="bg-border/40 my-4" />
        
        <h3 className="text-lg font-medium text-white">Payment Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-white">Bank Details</h4>
            
            <FormField
              control={control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Bank Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. ABSA BANK"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Account Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. IVAN PRINTS"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Account Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 6008084570"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-md font-medium text-white">Mobile Money</h4>
            
            <FormField
              control={control}
              name="mobileProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Provider</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Airtel"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="mobilePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 0755 541 373"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="mobileContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Contact Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. (Vuule Abdul)"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalContentSection;
