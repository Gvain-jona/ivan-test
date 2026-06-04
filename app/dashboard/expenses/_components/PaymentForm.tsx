'use client';

import React from 'react';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function PaymentForm({ open, onOpenChange }: PaymentFormProps) {
  if (!open) return null;
  return (
    <div className="p-4">
      <button onClick={() => onOpenChange(false)} className="text-sm underline">Close</button>
    </div>
  );
}
