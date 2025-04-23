'use client';

import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SettingsSectionProps } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText } from 'lucide-react';
import LogoSelector from './LogoSelector';

/**
 * Company information section for invoice settings
 */
const CompanySection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Business Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <FormField
              control={control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your Company Name"
                      className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* TIN Number */}
            <FormField
              control={control}
              name="tinNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">TIN Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tax Identification Number"
                      className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Company Email */}
            <FormField
              control={control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="company@example.com"
                      className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Company Phone */}
            <FormField
              control={control}
              name="companyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#D1D5DB]">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your contact number"
                      className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Company Address */}
          <FormField
            control={control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Company Address/Tagline</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your company address or tagline"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#6B7280] text-xs mt-1.5">
                  This will appear under your company name
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Logo Section */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Company Logo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <LogoSelector name="companyLogo" />
        </CardContent>
      </Card>

      {/* Text Content Card */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Text Content</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom Footer Text */}
          <FormField
            control={control}
            name="customFooter"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Footer Text</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Thank you for your business"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#6B7280] text-xs mt-1.5">
                  This text will appear in the footer of your invoice
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Invoice Notes</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Additional notes for the invoice"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#6B7280] text-xs mt-1.5">
                  These notes will appear in the notes section of your invoice
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySection;
