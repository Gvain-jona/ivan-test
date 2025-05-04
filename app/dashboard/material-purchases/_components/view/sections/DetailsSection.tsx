'use client';

import React, { useState } from 'react';
import { Package, DollarSign, User, Building, Edit, ShoppingBag, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useMaterialPurchaseView } from '../context/MaterialPurchaseViewContext';
import { SectionHeader } from '../SectionHeader';
import { EditMaterialPurchaseDetailsForm } from '../EditMaterialPurchaseDetailsForm';

export function DetailsSection() {
  const { purchase } = useMaterialPurchaseView();
  const [showEditForm, setShowEditForm] = useState(false);

  if (!purchase) return null;

  // We'll handle payment status in the financial summary section

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Purchase Details"
        icon={<Package className="h-5 w-5" />}
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setShowEditForm(true)}
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Material
          </p>
          <p className="text-sm font-medium">{purchase.material_name}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Supplier
          </p>
          <p className="text-sm font-medium">{purchase.supplier_name || 'Not specified'}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <Ruler className="h-4 w-4 mr-2" />
            Quantity
          </p>
          <p className="text-sm font-medium">{purchase.quantity} {purchase.unit ? `(${purchase.unit})` : ''}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Unit Price
          </p>
          <p className="text-sm font-medium">{formatCurrency(purchase.unit_price || 0)}</p>
        </div>
      </div>

      {/* Payment status moved to Financial Summary section */}

      {/* Edit Details Form */}
      {showEditForm && (
        <EditMaterialPurchaseDetailsForm
          purchase={purchase}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
