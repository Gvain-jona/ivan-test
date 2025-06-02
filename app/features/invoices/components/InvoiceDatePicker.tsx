'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

export const InvoiceDatePicker: React.FC<InvoiceDatePickerProps> = ({
  date,
  onDateChange,
  disabled = false,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-[140px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Change Date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && onDateChange(newDate)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};