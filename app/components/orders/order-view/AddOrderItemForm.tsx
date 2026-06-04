'use client';

import React from 'react';

interface AddOrderItemFormProps {
  orderId: string;
  onSubmit: (item: any) => void;
  onCancel: () => void;
}

export default function AddOrderItemForm({ onCancel }: AddOrderItemFormProps) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Add item form</p>
      <button onClick={onCancel} className="mt-2 text-sm underline">Cancel</button>
    </div>
  );
}
