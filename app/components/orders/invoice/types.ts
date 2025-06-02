import { Order } from '@/types/orders';
import { Control } from 'react-hook-form';

export interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onClose: () => void;
}

export interface InvoiceSettings {
  // Display options
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  includeSignature: boolean;
  format: 'a4' | 'letter';
  template: 'standard' | 'minimal' | 'detailed';

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

  // Content
  notes: string;
  customHeader: string;
  customFooter: string;

  // Company information
  tinNumber: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyLogo: string;
  
  // Logo settings
  logoSize: 'small' | 'medium' | 'large';
  logoShowBorder: boolean;
  logoZoom: number; // 0.5 to 3.0 (50% to 300%)

  // Payment details
  bankDetails: BankDetail[];
  mobileMoneyDetails: MobileMoneyDetail[];
}

export interface BankDetail {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface MobileMoneyDetail {
  id: string;
  provider: string;
  phoneNumber: string;
  contactName: string;
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
  order: Order | null;
}

// Return type for the useInvoiceActions hook
export interface UseInvoiceActionsReturn {
  handleDownload: () => Promise<void>;
  handlePrint: () => void;
  isDownloading: boolean;
}

// Simplified invoice settings for new template
export interface SimplifiedInvoiceSettings {
  // Company
  companyName: string;
  companyLogo?: string;
  logoSize: 'small' | 'medium' | 'large';
  logoShowBorder: boolean;
  logoZoom: number;
  tagline: string;
  phone: string;
  email: string;
  tin: string;
  
  // Payment (now supports multiple entries)
  bankDetails: Array<{
    accountName: string;
    bankName: string;
    accountNumber: string;
  }>;
  mobileMoneyDetails: Array<{
    provider: string;
    phone: string;
    name: string;
  }>;
}

// Adapter function to convert complex settings to simplified
export function toSimplifiedSettings(complex: InvoiceSettings): SimplifiedInvoiceSettings {
  return {
    companyName: complex.companyName || 'IVAN PRINTS LIMITED',
    companyLogo: complex.companyLogo,
    logoSize: complex.logoSize || 'medium',
    logoShowBorder: complex.logoShowBorder ?? true,
    logoZoom: complex.logoZoom ?? 1.0,
    tagline: complex.companyAddress || 'DESIGN.PRINT.BRAND.',
    phone: complex.companyPhone || '+256(0) 755 541 373',
    email: complex.companyEmail || 'sherilox356@gmail.com',
    tin: complex.tinNumber || '1050884489',
    bankDetails: complex.bankDetails && complex.bankDetails.length > 0 
      ? complex.bankDetails.map(bd => ({
          accountName: bd.accountName,
          bankName: bd.bankName,
          accountNumber: bd.accountNumber
        }))
      : [{
          accountName: 'IVAN PRINTS',
          bankName: 'ABSA BANK',
          accountNumber: '6008084570'
        }],
    mobileMoneyDetails: complex.mobileMoneyDetails && complex.mobileMoneyDetails.length > 0
      ? complex.mobileMoneyDetails.map(mmd => ({
          provider: mmd.provider,
          phone: mmd.phoneNumber,
          name: mmd.contactName
        }))
      : [{
          provider: 'MTN Mobile Money',
          phone: '0755 541 373',
          name: 'Wadie Abduli'
        }]
  };
}
