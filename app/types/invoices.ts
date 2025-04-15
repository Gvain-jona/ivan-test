import { Order } from './orders';

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

export interface InvoiceFilters {
  orderId?: string;
  startDate?: string;
  endDate?: string;
  isProforma?: boolean;
  search?: string;
}

export interface InvoiceListItem {
  id: string;
  order_id: string;
  invoice_number: string;
  invoice_date: string;
  file_url: string;
  is_proforma: boolean;
  created_by: string;
  created_at: string;
  order?: Order;
}

export interface InvoiceDetail extends InvoiceListItem {
  storage_path: string;
  settings: InvoiceSettings;
  updated_at: string;
}

export interface InvoiceCreateParams {
  orderId: string;
  fileUrl: string;
  storagePath: string;
  settings: InvoiceSettings;
  isProforma?: boolean;
}

export interface InvoiceResponse {
  invoices: InvoiceListItem[];
  totalCount: number;
  pageCount: number;
}
