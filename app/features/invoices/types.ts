import { Order } from '@/types/orders';
import { Control } from 'react-hook-form';

/**
 * Props for the main InvoiceSheet component
 */
export interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
  initialSettings?: InvoiceSettings;
}

/**
 * Bank account details for invoice payment
 */
export interface BankDetail {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

/**
 * Mobile money details for invoice payment
 */
export interface MobileMoneyDetail {
  id: string;
  provider: string;
  phoneNumber: string;
  contactName: string;
}

/**
 * Invoice settings configuration
 */
export interface InvoiceSettings {
  // Company information
  companyName: string;
  companyLogo: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  tinNumber: string;
  
  // Layout options
  showHeader: boolean;
  showFooter: boolean;
  showLogo: boolean;
  
  // Logo customization options
  logoSize?: 'small' | 'medium' | 'large';
  logoZoom?: number;
  logoPanX?: number;
  logoPanY?: number;
  logoShowBorder?: boolean;
  
  // Item display options
  showItemCategory: boolean;
  showItemName: boolean;
  showItemSize: boolean;
  itemDisplayFormat: 'combined' | 'separate';
  
  // Tax and discount options
  includeTax: boolean;
  taxRate: number;
  includeDiscount: boolean;
  discountRate: number;
  
  // Content options
  notes: string;
  customFooter: string;
  
  // Payment details
  bankDetails: BankDetail[];
  mobileMoneyDetails: MobileMoneyDetail[];
}

/**
 * Props for the invoice settings component sections
 */
export interface SettingsSectionProps {
  control: Control<InvoiceSettings>;
}

/**
 * Props for the invoice preview component
 */
export interface InvoicePreviewProps {
  order: Order;
  settings: InvoiceSettings;
  previewRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Props for the invoice template component
 */
export interface InvoiceTemplateProps {
  order: Order;
  settings: InvoiceSettings;
}

/**
 * Invoice settings record as stored in the database
 */
export interface InvoiceSettingRecord {
  id: string;
  name: string;
  is_default: boolean;
  settings: InvoiceSettings;
  created_at: string;
  updated_at: string;
}

/**
 * PDF generation options
 */
export interface PdfGenerationOptions {
  quality: 'low' | 'medium' | 'high';
  format: 'a4';
  orientation: 'portrait' | 'landscape';
}

/**
 * Context value for the invoice context
 */
export interface InvoiceContextValue {
  order: Order;
  settings: InvoiceSettings;
  updateSettings: (name: keyof InvoiceSettings, value: any) => void;
  isGenerating: boolean;
  progress: number;
  generatePdf: () => Promise<void>;
}
