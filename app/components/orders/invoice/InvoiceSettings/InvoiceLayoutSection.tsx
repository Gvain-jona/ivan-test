import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsSectionProps } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout, Image as ImageIcon, FileSignature, FootprintsIcon } from 'lucide-react';

/**
 * Component for the invoice layout settings section
 *
 * Handles checkbox options for layout elements like header, footer, logo, and signature
 */
const InvoiceLayoutSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Invoice Layout</CardTitle>
          </div>
        </CardHeader>
        <CardContent>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 border-r border-border/30 pr-4">
              <FormField
                control={control}
                name="includeHeader"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Include Header
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Show company information at the top
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="includeFooter"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Include Footer
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Show custom footer text at the bottom
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormField
                control={control}
                name="includeLogo"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Include Logo
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Display your company logo on the invoice
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="includeSignature"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer">
                        Include Signature Line
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Add a line for signatures at the bottom
                      </FormDescription>
                    </div>
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

export default InvoiceLayoutSection;
