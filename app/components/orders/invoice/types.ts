import { Order } from '@/types/orders';
import { Control } from 'react-hook-form';

export interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onClose: () => void;
}

export interface InvoiceSettings {
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  includeSignature: boolean;
  format: 'a4' | 'letter';
  template: 'standard' | 'minimal' | 'detailed';
  notes: string;
  paymentTerms: string;
  customHeader: string;
  customFooter: string;
  tinNumber: string;
  proformaNumber: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyLogo: string;
  // Bank details
  bankName: string;
  accountName: string;
  accountNumber: string;
  // Mobile money details
  mobileProvider: string;
  mobilePhone: string;
  mobileContact: string;
}

// Props for the InvoicePreview component
export interface InvoicePreviewProps {
  order: Order;
  invoiceUrl: string | null;
  isGenerating: boolean;
  error?: string | null;
  settings: InvoiceSettings;
  onGenerate: () => void;
}

// Shared props for settings sections
export interface SettingsSectionProps {
  control: Control<InvoiceSettings>;
}

// Props for the main InvoiceSettings component
export interface InvoiceSettingsProps {
  form: any; // Using any for now, will be replaced with UseFormReturn<InvoiceSettings>
}

// Props for the useInvoiceGeneration hook
export interface UseInvoiceGenerationProps {
  orderId?: string;
  order?: Order | null;
}

// Return type for the useInvoiceGeneration hook
export interface UseInvoiceGenerationReturn {
  invoiceUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  generateInvoiceWithSettings: (settings: InvoiceSettings) => Promise<void>;
  resetInvoice: () => void;
}

// Props for the useInvoiceActions hook
export interface UseInvoiceActionsProps {
  invoiceUrl: string | null;
}

// Return type for the useInvoiceActions hook
export interface UseInvoiceActionsReturn {
  handleDownload: () => void;
  handlePrint: () => void;
}
