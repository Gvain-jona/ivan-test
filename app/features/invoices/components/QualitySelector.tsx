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
          className="flex items-center gap-2"
          disabled={disabled}
        >
          {selectedQuality === 'digital' ? (
            <>
              <Monitor className="h-4 w-4" />
              <span>Digital Quality</span>
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              <span>Print Quality</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Select Quality</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => {
            onQualityChange('digital');
            setOpen(false); // Close dropdown after selection
          }}
        >
          <Monitor className="h-4 w-4" />
          <div>
            <div>Digital Quality</div>
            <div className="text-xs text-muted-foreground">Smaller file size (~200KB), optimized for digital sharing</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => {
            onQualityChange('print');
            setOpen(false); // Close dropdown after selection
          }}
        >
          <Printer className="h-4 w-4" />
          <div>
            <div>Print Quality</div>
            <div className="text-xs text-muted-foreground">High-quality resolution (~1MB), good for printing</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
