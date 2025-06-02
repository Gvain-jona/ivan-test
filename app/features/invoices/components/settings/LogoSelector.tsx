'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { FormDescription } from '@/components/ui/form';
import { useWatch } from 'react-hook-form';
import { BUCKETS } from '@/lib/supabase/storage';

// Predefined logos
const PREDEFINED_LOGOS = [
  {
    id: 'default',
    src: '/images/default-logo.svg',
    label: 'Default Logo',
  },
  {
    id: 'logo1',
    src: '/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_1.jpg',
    label: 'Logo 1',
  },
  {
    id: 'logo2',
    src: '/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_2.jpg',
    label: 'Logo 2',
  },
  {
    id: 'logo3',
    src: '/images/1745189577949-42d1e3bb-5882-40c6-adda-1bf690b97ee1_3.jpg',
    label: 'Logo 3',
  },
];

interface LogoSelectorProps {
  name?: string;
}

const LogoSelector: React.FC<LogoSelectorProps> = ({ name = 'companyLogo' }) => {
  const { control, getValues, setValue } = useFormContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('gallery');
  
  // Watch logo-related values for live preview
  const watchedLogo = useWatch({ control, name: 'companyLogo' });
  const watchedSize = useWatch({ control, name: 'logoSize' });
  const watchedBorder = useWatch({ control, name: 'logoShowBorder' });
  const watchedZoom = useWatch({ control, name: 'logoZoom' });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo Preview */}
            <div className="w-full md:w-1/3 bg-muted/30 rounded-md p-4 flex flex-col items-center justify-center">
              <div className="w-32 h-32 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                {field.value ? (
                  <Image
                    src={field.value}
                    alt="Logo Preview"
                    fill
                    className="object-contain p-2"
                    onError={() => {
                      toast({
                        variant: "destructive",
                        title: "Error loading logo",
                        description: "The logo image could not be loaded. Please select another image."
                      });
                      // Reset to default logo if the current one fails to load
                      field.onChange('/images/default-logo.svg');
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm text-center p-2">
                    No logo selected
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                {field.value ? 'Logo Preview' : 'Select a logo from the options or upload your own'}
              </p>
            </div>

            {/* Logo Selection */}
            <div className="w-full md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="gallery">Logo Gallery</TabsTrigger>
                  <TabsTrigger value="upload">Upload Logo</TabsTrigger>
                </TabsList>

                <TabsContent value="gallery" className="space-y-4">
                  <Card>
                    <CardContent className="pt-4">
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 gap-4"
                      >
                        {PREDEFINED_LOGOS.map((logo) => (
                          <div key={logo.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={logo.src} id={`logo-${logo.id}`} />
                            <Label htmlFor={`logo-${logo.id}`} className="flex items-center gap-2">
                              <div className="w-12 h-12 relative border border-dashed border-border rounded-md overflow-hidden flex items-center justify-center bg-background/50">
                                <Image
                                  src={logo.src}
                                  alt={logo.label}
                                  width={40}
                                  height={40}
                                  className="object-contain p-1"
                                />
                              </div>
                              <span className="text-sm">{logo.label}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <Card>
                    <CardContent className="pt-4">
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
                          bucketName={BUCKETS.LOGOS}
                          accept="image/*"
                          maxSize={2}
                          showPreview={true}
                        />
                      </FormControl>

                      <div className="mt-3 text-[#6B7280] text-xs space-y-1">
                        <div>• Maximum file size: 2MB</div>
                        <div>• Recommended dimensions: 200x200 pixels</div>
                        <div>• Transparent background (PNG) works best</div>
                        <div>• Will be displayed in the top-left of your invoice</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <FormMessage />
              
              {/* Logo Display Settings - Only show if logo is selected */}
              {field.value && (
                <Card className="mt-6">
                  <CardContent className="pt-4">
                    <div className="space-y-6">
                      {/* Logo Preview and Controls Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Live Preview Section */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-border/40">
                          <h4 className="text-sm font-medium text-foreground mb-3">Live Preview</h4>
                          <div className="flex items-center justify-center min-h-[120px]">
                            {/* Exact replica of invoice template logo styling */}
                            <div style={{
                              width: watchedSize === 'small' ? '60px' : 
                                     watchedSize === 'large' ? '100px' : '80px',
                              height: watchedSize === 'small' ? '60px' : 
                                      watchedSize === 'large' ? '100px' : '80px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              borderRadius: '8px',
                              border: watchedBorder ? '2px solid #0a3b22' : 'none',
                              padding: watchedBorder ? '0' : '4px',
                              position: 'relative',
                              backgroundColor: 'white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                              <img 
                                src={field.value}
                                alt="Logo Preview"
                                style={{
                                  maxWidth: 'none',
                                  maxHeight: 'none',
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  transform: `scale(${watchedZoom || 1})`,
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  transformOrigin: 'center',
                                  position: 'relative'
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Exact invoice appearance
                          </p>
                        </div>
                        
                        {/* Logo Controls Section */}
                        <div className="space-y-4">
                          {/* Logo Size Selector */}
                          <FormField
                            control={control}
                            name="logoSize"
                            render={({ field: sizeField }) => (
                              <FormItem>
                                <FormLabel>Logo Size</FormLabel>
                                <FormControl>
                                  <Select value={sizeField.value || 'medium'} onValueChange={sizeField.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select logo size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="small">Small (60x60)</SelectItem>
                                      <SelectItem value="medium">Medium (80x80)</SelectItem>
                                      <SelectItem value="large">Large (100x100)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          {/* Show Border Toggle */}
                          <FormField
                            control={control}
                            name="logoShowBorder"
                            render={({ field: borderField }) => (
                              <FormItem className="flex items-center justify-between space-y-0">
                                <div className="flex-1">
                                  <FormLabel>Show Logo Border</FormLabel>
                                  <FormDescription className="text-xs mt-1">
                                    Display a border around your logo
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={borderField.value ?? true}
                                    onCheckedChange={borderField.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          {/* Zoom Control */}
                          <FormField
                            control={control}
                            name="logoZoom"
                            render={({ field: zoomField }) => (
                              <FormItem>
                                <FormLabel>Logo Zoom ({Math.round((zoomField.value || 1) * 100)}%)</FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[zoomField.value || 1]}
                                    onValueChange={(values) => zoomField.onChange(values[0])}
                                    min={0.5}
                                    max={3.0}
                                    step={0.1}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs mt-1">
                                  Scale your logo from 50% to 300%
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          
                          
                          {/* Reset Button */}
                          <div className="pt-2 flex justify-between items-center">
                            <button
                              type="button"
                              onClick={() => {
                                setValue('logoZoom', 1.0);
                                setValue('logoSize', 'medium');
                                setValue('logoShowBorder', true);
                              }}
                              className="text-sm text-orange-500 hover:text-orange-400 underline"
                            >
                              Reset Logo Settings
                            </button>
                            <div className="text-xs text-muted-foreground">
                              Size: {watchedSize || 'medium'} | 
                              Zoom: {Math.round((watchedZoom || 1) * 100)}% | 
                              Border: {watchedBorder ? 'On' : 'Off'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </FormItem>
      )}
    />
  );
};

export default LogoSelector;
