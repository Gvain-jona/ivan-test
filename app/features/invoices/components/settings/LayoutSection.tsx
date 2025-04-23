'use client';

import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsSectionProps } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout, ListFilter, Percent } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

/**
 * Layout section for invoice settings
 */
const LayoutSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      {/* Invoice Layout Options */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Invoice Layout</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <FormField
                control={control}
                name="showHeader"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#F97316] mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Show Header
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Display the header section with company info
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="showFooter"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#F97316] mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Show Footer
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Display the footer section with custom text
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormField
                control={control}
                name="showLogo"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#F97316] mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Show Logo
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Display your company logo on the invoice
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Display Options */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Item Display Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Item Components to Show */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-[#D1D5DB]">Item Components to Show</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="showItemCategory"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#F97316] mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                          Show Category
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="showItemName"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#F97316] mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                          Show Item Name
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="showItemSize"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#F97316] mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                          Show Size
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Display Format */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-[#D1D5DB]">Display Format</h4>
              <FormField
                control={control}
                name="itemDisplayFormat"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border border-border/60 p-3 bg-card/50">
                          <FormControl>
                            <RadioGroupItem value="combined" className="data-[state=checked]:bg-[#F97316]" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                              Combined Format
                            </FormLabel>
                            <FormDescription className="text-xs text-muted-foreground">
                              Show as "Category - Item Name (Size)"
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border border-border/60 p-3 bg-card/50">
                          <FormControl>
                            <RadioGroupItem value="separate" className="data-[state=checked]:bg-[#F97316]" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                              Separate Format
                            </FormLabel>
                            <FormDescription className="text-xs text-muted-foreground">
                              Show each component in separate columns
                            </FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Discount Options */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-[#F97316]" />
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
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#F97316] mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Include Tax
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Add tax calculation to the invoice
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
                        placeholder="18"
                        className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={!control._formValues.includeTax}
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
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#F97316] mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Include Discount
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Add discount calculation to the invoice
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
                        placeholder="10"
                        className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={!control._formValues.includeDiscount}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutSection;
