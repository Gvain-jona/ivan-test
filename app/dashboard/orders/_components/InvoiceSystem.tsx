'use client';

import React from 'react';
import { InvoiceButton } from '@/app/features/invoices';
import { Order } from '@/types/orders';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useOrdersPage } from '../_context';

interface InvoiceButtonWrapperProps {
  order: Order;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  label?: string;
  className?: string;
  useContextHandler?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Wrapper component for the invoice button
 * This is used to integrate the invoice system with the orders table
 */
const InvoiceButtonWrapper: React.FC<InvoiceButtonWrapperProps> = ({
  order,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  label = 'Invoice',
  className,
  useContextHandler = false,
  onClick,
}) => {
  // Get the context handler if needed
  const context = useContextHandler ? useOrdersPage() : null;
  const handleGenerateInvoice = context?.handleGenerateInvoice;

  // If we're using the context handler and it exists, create a button that calls it
  if (useContextHandler && handleGenerateInvoice) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          // Stop propagation to prevent parent elements from handling the click
          e.stopPropagation();
          // Call the custom onClick handler if provided
          if (onClick) onClick(e);
          // Call the context handler
          handleGenerateInvoice(order);
        }}
        className={className}
      >
        {showIcon && <FileText className="h-4 w-4 mr-2" />}
        {label}
      </Button>
    );
  }

  // Otherwise, use the new InvoiceButton component
  return (
    <InvoiceButton
      order={order}
      variant={variant}
      size={size}
      showIcon={showIcon}
      label={label}
      className={className}
      onClick={onClick}
    />
  );
};

export default InvoiceButtonWrapper;
