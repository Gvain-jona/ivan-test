'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Announcement,
  AnnouncementVariant,
  AnnouncementTag,
  AppPageLink,
  ANNOUNCEMENT_TAGS,
  APP_PAGE_LINKS
} from '@/app/types/announcements';
import { cn } from '@/lib/utils';

// Form schema
const announcementFormSchema = z.object({
  tag: z.enum(ANNOUNCEMENT_TAGS, {
    errorMap: () => ({ message: 'Please select a valid tag' })
  }),
  message: z.string().min(1, 'Message is required').max(100, 'Message must be 100 characters or less'),
  link: z.union([
    z.enum(APP_PAGE_LINKS.map(link => link.value) as [AppPageLink, ...AppPageLink[]], {
      errorMap: () => ({ message: 'Please select a valid link' })
    }),
    z.literal("none")
  ]).optional(),
  variant: z.enum(['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info']),
  is_active: z.boolean().default(true),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

interface AnnouncementFormProps {
  announcement?: Announcement | null;
  onSave: (data: AnnouncementFormValues) => void;
  onCancel: () => void;
}

export function AnnouncementForm({ announcement, onSave, onCancel }: AnnouncementFormProps) {
  // Initialize form with default values or existing announcement
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      tag: announcement?.tag || 'Announcement', // Use a valid default from ANNOUNCEMENT_TAGS
      message: announcement?.message || '',
      link: announcement?.link || 'none', // Use 'none' as default for the dropdown
      variant: (announcement?.variant as AnnouncementVariant) || 'info',
      is_active: announcement?.is_active ?? true,
      start_date: announcement?.start_date ? new Date(announcement.start_date) : undefined,
      end_date: announcement?.end_date ? new Date(announcement.end_date) : undefined,
    },
  });

  // Handle form submission
  const onSubmit = (data: AnnouncementFormValues) => {
    onSave(data);
  };

  // Get variant color
  const getVariantColor = (variant: AnnouncementVariant) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'destructive':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      case 'secondary':
        return 'bg-purple-500 text-white';
      case 'outline':
        return 'bg-transparent border-2 border-gray-300 text-foreground';
      default:
        return 'bg-primary text-white';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ANNOUNCEMENT_TAGS.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Short text displayed in the tag section of the announcement.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="variant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Variant</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="default">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full bg-primary")}></div>
                        <span>Default</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="secondary">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full bg-purple-500")}></div>
                        <span>Secondary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="destructive">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full bg-red-500")}></div>
                        <span>Destructive</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="outline">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full border-2 border-gray-300")}></div>
                        <span>Outline</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="success">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full bg-green-500")}></div>
                        <span>Success</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full bg-yellow-500")}></div>
                        <span>Warning</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full bg-blue-500")}></div>
                        <span>Info</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The visual style of the announcement.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter announcement message"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The main text of the announcement (max 100 characters).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (Optional)</FormLabel>
              <Select
                onValueChange={(value) => {
                  // Keep "none" as is - we'll handle it in the API
                  field.onChange(value);
                }}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a page link" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No link</span>
                  </SelectItem>
                  {APP_PAGE_LINKS.map((link) => (
                    <SelectItem key={link.value} value={link.value}>
                      {link.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Where users will be directed when clicking the announcement.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const endDate = form.getValues("end_date");
                        return endDate ? date > endDate : false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the announcement should start showing.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const startDate = form.getValues("start_date");
                        return startDate ? date < startDate : false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the announcement should stop showing.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Whether this announcement should be displayed.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {announcement ? 'Update' : 'Create'} Announcement
          </Button>
        </div>
      </form>
    </Form>
  );
}
