'use client';

import { createContext, useContext } from 'react';
import { MaterialPurchase } from '@/types/materials';

interface MaterialPurchaseViewContextType {
  purchase: MaterialPurchase | null;
  isLoading: boolean;
  isError: boolean;
  refreshPurchase: (data?: any, options?: any) => Promise<any>;
  onEdit: (purchase: MaterialPurchase) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

// Create the context with a default value
export const MaterialPurchaseViewContext = createContext<MaterialPurchaseViewContextType>({
  purchase: null,
  isLoading: false,
  isError: false,
  refreshPurchase: async () => {},
  onEdit: async () => {},
  onDelete: async () => {},
  isDeleting: false
});

// Custom hook to use the context
export const useMaterialPurchaseView = () => {
  const context = useContext(MaterialPurchaseViewContext);
  if (!context) {
    throw new Error('useMaterialPurchaseView must be used within a MaterialPurchaseViewContext.Provider');
  }
  return context;
};
