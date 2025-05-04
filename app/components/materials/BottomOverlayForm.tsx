import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface BottomOverlayFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomOverlayForm({
  isOpen,
  onClose,
  title,
  children,
}: BottomOverlayFormProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
