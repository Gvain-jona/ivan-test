import React, { useState } from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SettingsSectionProps } from '../types';
import Image from 'next/image';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Mail, Phone, FileText, Upload, Info, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

/**
 * Component for the company information section
 *
 * Handles company details like name, contact info, and logo
 */
const CompanyInformationSection: React.FC<SettingsSectionProps> = ({ control }) => {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
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
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="text-[#D1D5DB]">Company Name</FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Enter company name"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
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
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="text-[#D1D5DB]">TIN Number</FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Enter TIN number"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Email */}
            <FormField
              control={control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="text-[#D1D5DB]">Email</FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter company email"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
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
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="text-[#D1D5DB]">Phone</FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Enter company phone"
                      className="bg-transparent border-[#2B2B40] focus:border-orange-500"
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
              <FormItem className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <FormLabel className="text-[#D1D5DB]">Address/Tagline</FormLabel>
                </div>
                <FormControl>
                  <Input
                    placeholder="Enter company address or tagline"
                    className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#6B7280] text-xs mt-1.5">
                  This will appear below your company name on the invoice
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Company Logo Card */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Company Logo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="companyLogo"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Logo Preview */}
                  <div className="w-full md:w-1/3 bg-muted/30 rounded-md p-4 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                      {field.value ? (
                        <Image
                          src={field.value}
                          alt="Company Logo Preview"
                          fill
                          className="object-contain p-2"
                          onError={(e) => {
                            // Show fallback on error
                            e.currentTarget.src = '/images/default-logo.svg';
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-center p-4">
                          <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No logo uploaded</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Preview</p>
                  </div>

                  {/* Logo Selection */}
                  <div className="w-full md:w-2/3">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-[#D1D5DB] mb-2">Choose a Logo</h4>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="/images/default-logo.svg" id="logo-default" />
                          <Label htmlFor="logo-default" className="flex items-center gap-2">
                            <div className="w-12 h-12 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                              <Image
                                src="/images/default-logo.svg"
                                alt="Default Logo"
                                width={40}
                                height={40}
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="text-sm">Default</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_1.jpg" id="logo-1" />
                          <Label htmlFor="logo-1" className="flex items-center gap-2">
                            <div className="w-12 h-12 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                              <Image
                                src="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_1.jpg"
                                alt="Logo 1"
                                width={40}
                                height={40}
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="text-sm">Logo 1</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_2.jpg" id="logo-2" />
                          <Label htmlFor="logo-2" className="flex items-center gap-2">
                            <div className="w-12 h-12 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                              <Image
                                src="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_2.jpg"
                                alt="Logo 2"
                                width={40}
                                height={40}
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="text-sm">Logo 2</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_3.jpg" id="logo-3" />
                          <Label htmlFor="logo-3" className="flex items-center gap-2">
                            <div className="w-12 h-12 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                              <Image
                                src="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_3.jpg"
                                alt="Logo 3"
                                width={40}
                                height={40}
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="text-sm">Logo 3</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_4.jpg" id="logo-4" />
                          <Label htmlFor="logo-4" className="flex items-center gap-2">
                            <div className="w-12 h-12 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                              <Image
                                src="/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_4.jpg"
                                alt="Logo 4"
                                width={40}
                                height={40}
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="text-sm">Logo 4</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-[#D1D5DB] mb-2">Or Upload Your Own</h4>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          onError={(error) => {
                            toast({
                              variant: "destructive",
                              title: "Upload failed",
                              description: error.message
                            });
                          }}
                          bucketName="logos"
                          accept="image/*"
                          maxSize={2}
                          showPreview={false}
                        />
                      </FormControl>
                    </div>

                    <div className="mt-3 text-[#6B7280] text-xs space-y-1">
                      <div>• Maximum file size: 2MB</div>
                      <div>• Recommended dimensions: 200x200 pixels</div>
                      <div>• Transparent background (PNG) works best</div>
                      <div>• Will be displayed in the top-left of your invoice</div>
                    </div>
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Text Content Card */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Text Content</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom Header Text */}
          <FormField
            control={control}
            name="customHeader"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Custom Header Text</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Add custom text to the invoice header"
                    className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#6B7280] text-xs mt-1.5">
                  Optional text to show in the header section of your invoice
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Footer Tagline */}
          <FormField
            control={control}
            name="customFooter"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Footer Tagline</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your company tagline"
                    className="bg-transparent border-[#2B2B40] focus:border-orange-500"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#6B7280] text-xs mt-1.5">
                  This will appear in the colored footer section of your invoice (default: "MAKING YOU VISIBLE")
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyInformationSection;
