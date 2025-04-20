import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SettingsSectionProps } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileType } from 'lucide-react';

/**
 * Component for the invoice format options section
 *
 * Handles paper size and template selection
 * Currently restricted to A4 size and Standard template only
 */
const FormatOptionsSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileType className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Format Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-r border-border/30 pr-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Paper Size</h4>
              </div>

              <FormField
                control={control}
                name="format"
                render={({ field }) => {
                  // Always set to A4
                  React.useEffect(() => {
                    field.onChange('a4');
                  }, []);

                  return (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-[#D1D5DB] text-sm">Current Size</FormLabel>
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">A4</span>
                      </div>
                      <FormDescription className="text-[#6B7280] text-xs mt-1">
                        Currently only A4 size is supported for optimal printing
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileType className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Template Style</h4>
              </div>

              <FormField
                control={control}
                name="template"
                render={({ field }) => {
                  // Always set to standard
                  React.useEffect(() => {
                    field.onChange('standard');
                  }, []);

                  return (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-[#D1D5DB] text-sm">Current Template</FormLabel>
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">Standard</span>
                      </div>
                      <FormDescription className="text-[#6B7280] text-xs mt-1">
                        Currently only Standard template is supported
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormatOptionsSection;
