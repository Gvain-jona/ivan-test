'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import { PlusCircle } from 'lucide-react';

interface OrdersPageHeaderProps {
  title: string;
  description: string;
  onCreateOrder?: () => void;
}

/**
 * Header component for the Orders page displaying the title and description
 */
const OrdersPageHeader: React.FC<OrdersPageHeaderProps> = ({
  title,
  description,
  onCreateOrder
}) => {
  return (
    <div className="flex flex-row justify-between items-center mb-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {onCreateOrder && (
        <Button
          onClick={onCreateOrder}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2 px-5 py-2.5 h-11 shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all duration-200 rounded-lg text-base"
          size="lg"
        >
          <PlusCircle className="h-5 w-5" />
          New Order
        </Button>
      )}
    </div>
  );
};

export default OrdersPageHeader;