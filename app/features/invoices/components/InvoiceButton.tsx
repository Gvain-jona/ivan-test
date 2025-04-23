'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Order } from '@/types/orders';
import InvoiceSheet from './InvoiceSheet';

interface InvoiceButtonProps extends ButtonProps {
  order: Order;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  label?: string;
}

/**
 * Button component for opening the invoice sheet
 */
const InvoiceButton: React.FC<InvoiceButtonProps> = ({
  order,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  label = 'Invoice',
  className,
  ...props
}) => {
  const [open, setOpen] = useState(false);

  // Handle button click
  const handleClick = (e: React.MouseEvent) => {
    // If there's an onClick prop, call it first
    if (props.onClick) {
      props.onClick(e);
    }

    // If the event wasn't prevented, open the invoice sheet
    if (!e.defaultPrevented) {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        {...props}
      >
        {showIcon && <FileText className="h-4 w-4 mr-2" />}
        {label}
      </Button>

      <InvoiceSheet
        open={open}
        onOpenChange={setOpen}
        order={order}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default InvoiceButton;
