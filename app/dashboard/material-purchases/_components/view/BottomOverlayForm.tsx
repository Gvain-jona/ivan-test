'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomOverlayFormProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

/**
 * A bottom overlay form component that slides up from the bottom of the screen
 * Used for adding/editing payments, notes, and other data
 * Matches the styling used in expense view
 */
export function BottomOverlayForm({
  title,
  children,
  onClose,
  className
}: BottomOverlayFormProps) {
  // Lock body scroll when the form is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-[2px] animate-in fade-in-0 flex items-end justify-end pr-0 sm:pr-4 pb-0 sm:pb-4">
      <div
        className={cn(
          "fixed sm:relative w-full sm:w-[500px] md:w-[600px] lg:w-[700px] sm:min-w-[500px] md:min-w-[600px] max-h-[80vh] h-auto sm:h-auto bg-background border-t sm:border-l border-border shadow-lg rounded-t-xl sm:rounded-tl-xl sm:rounded-tr-none sm:rounded-bl-xl sm:rounded-br-none overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-xl font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(80vh-64px)] sm:max-h-[calc(80vh-64px)] w-full">
          <div className="w-full max-w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
