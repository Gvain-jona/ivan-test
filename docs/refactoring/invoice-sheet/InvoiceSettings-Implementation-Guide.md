# InvoiceSettings Component Implementation Guide

This document provides detailed instructions for implementing the `InvoiceSettings` component and its sub-components as part of the InvoiceSheet refactoring plan. These components will handle the settings tab functionality of the original InvoiceSheet component.

## Component Structure

We'll break down the settings into three logical sections:

1. `InvoiceLayoutSection` - Handles checkbox options for layout elements
2. `FormatOptionsSection` - Handles paper size and template selection
3. `AdditionalContentSection` - Handles notes, payment terms, and custom text fields

## File Locations

```
app/components/orders/invoice/InvoiceSettings/
├── index.tsx                    # Main settings component
├── InvoiceLayoutSection.tsx     # Layout settings section
├── FormatOptionsSection.tsx     # Format options section
└── AdditionalContentSection.tsx # Additional content section
```

## Types Definition

First, let's define the shared types in `app/components/orders/invoice/types.ts`:

```typescript
import { Order } from '@/types/orders';

export interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
}

export interface InvoiceSettings {
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  includeSignature: boolean;
  format: 'a4' | 'letter';
  template: 'standard' | 'minimal' | 'detailed';
  notes: string;
  paymentTerms: string;
  customHeader: string;
  customFooter: string;
}

// Shared props for settings sections
export interface SettingsSectionProps {
  control: any; // from react-hook-form
}
```

## 1. InvoiceLayoutSection Component

### Dependencies

```typescript
import React from 'react';
import { 
  FormField, 
  FormItem, 
  FormControl, 
  FormLabel 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsSectionProps } from '../types';
```

### Implementation

```typescript
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
```

## 2. FormatOptionsSection Component

### Dependencies

```typescript
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
```

### Implementation

```typescript
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
```

## 3. AdditionalContentSection Component

### Dependencies

```typescript
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
```

### Implementation

```typescript
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
      </div>
    </div>
  );
};

export default AdditionalContentSection;
```

## 4. Main InvoiceSettings Component

### Dependencies

```typescript
import React from 'react';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { UseFormReturn } from 'react-hook-form';
import { InvoiceSettings } from '../types';
import InvoiceLayoutSection from './InvoiceLayoutSection';
import FormatOptionsSection from './FormatOptionsSection';
import AdditionalContentSection from './AdditionalContentSection';
```

### Interface Definition

```typescript
interface InvoiceSettingsProps {
  form: UseFormReturn<InvoiceSettings>;
}
```

### Implementation

```typescript
const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({ form }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InvoiceLayoutSection control={form.control} />
          <FormatOptionsSection control={form.control} />
        </div>
        
        <Separator className="bg-[#2B2B40]" />
        
        <AdditionalContentSection control={form.control} />
      </div>
    </Form>
  );
};

export default InvoiceSettings;
```

## Usage Example

```typescript
// In the parent InvoiceSheet component
import InvoiceSettings from './InvoiceSettings';

// ...

<TabsContent value="settings" className="h-full p-6">
  <InvoiceSettings form={form} />
</TabsContent>
```

## Testing Checklist

- [ ] All form fields render correctly
- [ ] Form values are properly controlled by react-hook-form
- [ ] Changes to form fields update the form state
- [ ] Layout is responsive and works on different screen sizes
- [ ] All sections maintain the same styling as the original component
- [ ] Form validation works as expected (if applicable)

## Potential Improvements

1. **Form Validation**: Add validation rules to ensure required fields are filled
2. **Conditional Fields**: Show/hide certain fields based on other selections
3. **Tooltips**: Add tooltips to explain the purpose of each setting
4. **Preview Updates**: Add real-time preview updates when settings change
5. **Preset Templates**: Add the ability to save and load preset configurations

## Notes

- These components are focused on form rendering and don't contain business logic
- The form state management remains in the parent component
- The components are designed to be reusable and maintainable

By implementing these components according to the guide, we'll have successfully extracted the settings functionality from the original InvoiceSheet component, making it more maintainable and focused.
