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
import { ListFilter, Tag, Text, Layers } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * Component for the item display options section
 *
 * Handles how order items are displayed in the invoice
 */
const ItemDisplayOptionsSection: React.FC<SettingsSectionProps> = ({ control }) => {
  return (
    <Card className="border-border/40 bg-background/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">Item Display Options</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Item Components to Show */}
          <div>
            <h4 className="text-sm font-medium mb-3">Item Components to Show</h4>
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
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer flex items-center">
                        <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        Category
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Show item category in invoice
                      </FormDescription>
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
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer flex items-center">
                        <Text className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        Item Name
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Show item name in invoice
                      </FormDescription>
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
                        className="data-[state=checked]:bg-orange-500 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#D1D5DB] font-medium cursor-pointer flex items-center">
                        <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        Size
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Show item size in invoice
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Display Format */}
          <div>
            <h4 className="text-sm font-medium mb-3">Display Format</h4>
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
                          <RadioGroupItem value="combined" className="data-[state=checked]:bg-orange-500" />
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
                          <RadioGroupItem value="separate" className="data-[state=checked]:bg-orange-500" />
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
  );
};

export default ItemDisplayOptionsSection;
