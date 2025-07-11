'use client';

import React, { createContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { InvoiceContextValue, InvoiceSettings } from '../types';
import { Order } from '@/types/orders';

// Create the context with a default undefined value
export const InvoiceContext = createContext<InvoiceContextValue | undefined>(undefined);

// Empty settings template - no hardcoded defaults
export const emptyInvoiceSettings: InvoiceSettings = {
  // Company information
  companyName: '',
  companyLogo: '',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  tinNumber: '',
  
  // Layout options
  showHeader: true,
  showFooter: true,
  showLogo: false,
  
  // Logo customization options (optional fields)
  logoSize: 'medium',
  logoZoom: 1,
  logoPanX: 0,
  logoPanY: 0,
  logoShowBorder: false,
  
  // Item display options
  showItemCategory: true,
  showItemName: true,
  showItemSize: true,
  itemDisplayFormat: 'combined',
  
  // Tax and discount options
  includeTax: false,
  taxRate: 0,
  includeDiscount: false,
  discountRate: 0,
  
  // Content options
  notes: '',
  customFooter: '',
  
  // Payment details
  bankDetails: [],
  mobileMoneyDetails: [],
};

interface InvoiceProviderProps {
  children: ReactNode;
  order: Order;
  initialSettings?: Partial<InvoiceSettings>;
}

export const InvoiceProvider: React.FC<InvoiceProviderProps> = ({
  children,
  order,
  initialSettings = {},
}) => {
  // Use only the provided initial settings or empty template
  const [settings, setSettings] = useState<InvoiceSettings>(
    Object.keys(initialSettings).length > 0 ? initialSettings as InvoiceSettings : emptyInvoiceSettings
  );
  
  // PDF generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Update a specific setting
  const updateSettings = useCallback((name: keyof InvoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);
  
  // Generate PDF function (placeholder - will be implemented in a hook)
  const generatePdf = useCallback(async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Placeholder for actual PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(interval);
      setProgress(100);
      
      // Simulate completion
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
      setProgress(0);
    }
  }, []);
  
  // Create the context value
  const contextValue = useMemo<InvoiceContextValue>(() => ({
    order,
    settings,
    updateSettings,
    isGenerating,
    progress,
    generatePdf,
  }), [order, settings, updateSettings, isGenerating, progress, generatePdf]);
  
  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
};

// Custom hook to use the invoice context
export const useInvoiceContext = () => {
  const context = React.useContext(InvoiceContext);
  
  if (context === undefined) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  
  return context;
};
