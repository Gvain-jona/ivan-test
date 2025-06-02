'use client';

import React from 'react';
import { Printer, Monitor } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const qualities = [
    {
      value: 'digital' as const,
      icon: Monitor,
      label: 'Digital Quality',
      description: 'Smaller file size (~200KB), optimized for digital sharing'
    },
    {
      value: 'print' as const,
      icon: Printer,
      label: 'Print Quality',
      description: 'High-quality resolution (~1MB), good for printing'
    }
  ];

  const selectedOption = qualities.find(q => q.value === selectedQuality);
  const Icon = selectedOption?.icon || Monitor;

  return (
    <Select
      value={selectedQuality}
      onValueChange={(value) => onQualityChange(value as InvoiceQuality)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{selectedOption?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-[320px]">
        {qualities.map((quality) => {
          const QualityIcon = quality.icon;
          return (
            <SelectItem
              key={quality.value}
              value={quality.value}
              className="py-3"
            >
              <div className="flex items-start gap-3">
                <QualityIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{quality.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {quality.description}
                  </div>
                </div>
                {selectedQuality === quality.value && (
                  <div className="text-orange-500 font-bold ml-2">✓</div>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}