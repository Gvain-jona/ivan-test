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
  const { control } = useFormContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('gallery');

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
            </div>
          </div>
        </FormItem>
      )}
    />
  );
};

export default LogoSelector;
