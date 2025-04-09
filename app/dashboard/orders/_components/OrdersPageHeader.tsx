'use client';

import React from 'react';

interface OrdersPageHeaderProps {
  title: string;
  description: string;
}

/**
 * Header component for the Orders page displaying the title and description
 */
const OrdersPageHeader: React.FC<OrdersPageHeaderProps> = ({ 
  title, 
  description 
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-[#6D6D80]">
        {description}
      </p>
    </div>
  );
};

export default OrdersPageHeader; 