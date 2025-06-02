'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export type InvoiceQuality = 'digital' | 'print';

interface QualitySelectorProps {
  selectedQuality: InvoiceQuality;
  onQualityChange: (quality: InvoiceQuality) => void;
  disabled?: boolean;
}

export function QualitySelector({
  selectedQuality,
  onQualityChange,
  disabled = false
}: QualitySelectorProps) {
  // Add state to control the open state of the dropdown
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 min-w-[140px] justify-start"
          disabled={disabled}
          type="button"
        >
          {selectedQuality === 'digital' ? (
            <>
              <Monitor className="h-4 w-4 shrink-0" />
              <span className="truncate">Digital Quality</span>
            </>
          ) : (
            <>
              <Printer className="h-4 w-4 shrink-0" />
              <span className="truncate">Print Quality</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1">
        <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">Select Quality</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer focus:bg-orange-50 focus:text-orange-900"
          onSelect={() => {
            onQualityChange('digital');
            setOpen(false);
          }}
        >
          <Monitor className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Digital Quality</div>
            <div className="text-xs text-muted-foreground">Smaller file size (~200KB), optimized for digital sharing</div>
          </div>
          {selectedQuality === 'digital' && <div className="ml-2 text-orange-500 font-bold">✓</div>}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer focus:bg-orange-50 focus:text-orange-900"
          onSelect={() => {
            onQualityChange('print');
            setOpen(false);
          }}
        >
          <Printer className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Print Quality</div>
            <div className="text-xs text-muted-foreground">High-quality resolution (~1MB), good for printing</div>
          </div>
          {selectedQuality === 'print' && <div className="ml-2 text-orange-500 font-bold">✓</div>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
