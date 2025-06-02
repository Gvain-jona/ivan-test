# Invoice Template Migration Guide

## Overview
This guide outlines the migration from the current complex invoice template (950 lines) to a simplified, WYSIWYG-focused template (under 300 lines) while maintaining the existing dark theme with orange accents.

## Core Principles
- **What You See Is What You Get**: Preview must match PDF output exactly
- **No Large Files**: Keep all components under 200 lines
- **Simplicity Over Complexity**: Remove unnecessary features
- **No Data Duplication**: Use existing order data directly
- **Performance First**: Fast rendering and PDF generation
- **Maintain UI Consistency**: Respect the dark theme with orange accents

## Files to Modify (NOT Create)

### Primary Files (Must Edit)
1. `app/components/orders/invoice/OrangeInvoiceTemplate.tsx` - Replace with simplified version
2. `app/components/orders/invoice/types.ts` - Simplify InvoiceSettings interface
3. `app/components/orders/invoice/InvoiceSettings/index.tsx` - Simplify settings UI

### Secondary Files (Minor Updates)
1. `app/components/orders/invoice/EnhancedInvoicePreview.tsx` - Update to use new template
2. `app/components/orders/invoice/hooks/useInvoiceSettings.ts` - Update default settings

### Files to IGNORE (Do NOT Touch)
- Any file in `/app/features/invoices/` - Different invoice system
- Any file in `/app/components/archive/` - Old code
- Server-side generation files - Keep as fallback
- PDF generation utilities - Still needed

## Migration Steps

### Step 1: Simplify Invoice Template

**File:** `app/components/orders/invoice/OrangeInvoiceTemplate.tsx`

Replace entire content with simplified version:

```tsx
import React from 'react';
import { Order, OrderItem } from '@/types/orders';
import { SimplifiedInvoiceSettings } from './types';

interface OrangeInvoiceTemplateProps {
  order: Order | null;
  settings: SimplifiedInvoiceSettings;
}

const OrangeInvoiceTemplate: React.FC<OrangeInvoiceTemplateProps> = ({
  order,
  settings,
}) => {
  if (!order) {
    return <div className="text-center p-8">No order data available</div>;
  }

  // Simple inline styles for PDF reliability
  const styles = {
    container: { width: '100%', backgroundColor: 'white', color: '#000' },
    header: { backgroundColor: '#f97316', color: 'white', padding: '20px' },
    section: { padding: '20px' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { backgroundColor: '#f97316', color: 'white', padding: '10px', textAlign: 'left' as const },
    td: { padding: '10px', borderBottom: '1px solid #e5e7eb' },
    footer: { backgroundColor: '#f97316', color: 'white', padding: '20px', textAlign: 'center' as const }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>{settings.companyName}</h1>
        <p>{settings.tagline}</p>
        <p>{settings.phone} | {settings.email} | TIN: {settings.tin}</p>
      </div>

      {/* Invoice Info */}
      <div style={styles.section}>
        <h2>INVOICE #{order.order_number || order.id.substring(0, 8)}</h2>
        <p>Date: {new Date().toLocaleDateString()}</p>
        <p>Bill To: <strong>{order.client_name}</strong></p>
      </div>

      {/* Items Table */}
      <div style={styles.section}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Unit Price</th>
              <th style={styles.th}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{item.item_name}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>{item.unit_price.toLocaleString()}/=</td>
                <td style={styles.td}>{item.total_amount.toLocaleString()}/=</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>
                TOTAL:
              </td>
              <td style={{...styles.td, fontWeight: 'bold'}}>
                {order.total_amount.toLocaleString()}/=
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Details */}
      <div style={styles.section}>
        <h3>Payment Details</h3>
        <p><strong>Bank:</strong> {settings.bankDetails.bankName}</p>
        <p><strong>Account:</strong> {settings.bankDetails.accountName} - {settings.bankDetails.accountNumber}</p>
        <p><strong>Mobile Money:</strong> {settings.mobileMoneyDetails.phone} ({settings.mobileMoneyDetails.name})</p>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>Making You Visible</p>
      </div>
    </div>
  );
};

export default OrangeInvoiceTemplate;
```

### Step 2: Simplify Types

**File:** `app/components/orders/invoice/types.ts`

Add simplified interface (keep existing for backwards compatibility):

```tsx
// Add at the end of file
export interface SimplifiedInvoiceSettings {
  // Company
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  tin: string;
  
  // Payment (single entries only)
  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
  };
  mobileMoneyDetails: {
    phone: string;
    name: string;
  };
}

// Add adapter function
export function toSimplifiedSettings(complex: InvoiceSettings): SimplifiedInvoiceSettings {
  return {
    companyName: complex.companyName || 'IVAN PRINTS LIMITED',
    tagline: complex.companyAddress || 'DESIGN.PRINT.BRAND.',
    phone: complex.companyPhone || '+256(0) 755 541 373',
    email: complex.companyEmail || 'sherilox356@gmail.com',
    tin: complex.tinNumber || '1050884489',
    bankDetails: {
      accountName: complex.bankDetails?.[0]?.accountName || 'IVAN PRINTS',
      bankName: complex.bankDetails?.[0]?.bankName || 'ABSA BANK',
      accountNumber: complex.bankDetails?.[0]?.accountNumber || '6008084570',
    },
    mobileMoneyDetails: {
      phone: complex.mobileMoneyDetails?.[0]?.phoneNumber || '0755 541 373',
      name: complex.mobileMoneyDetails?.[0]?.contactName || 'Wadie Abduli',
    }
  };
}
```

### Step 3: Update EnhancedInvoicePreview

**File:** `app/components/orders/invoice/EnhancedInvoicePreview.tsx`

Update the import and usage:

```tsx
// At the top, add:
import { toSimplifiedSettings } from './types';

// Inside the component, update line 74:
<OrangeInvoiceTemplate order={order} settings={toSimplifiedSettings(settings)} />
```

### Step 4: Simplify Settings UI

**File:** `app/components/orders/invoice/InvoiceSettings/index.tsx`

Replace with simplified version:

```tsx
import React from 'react';
import { Form } from '@/components/ui/form';
import { InvoiceSettingsProps } from '../types';
import CompanyInformationSection from './CompanyInformationSection';
import PaymentDetailsSettings from '../PaymentDetailsSettings';
import SaveSettingsButton from '../SaveSettingsButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Invoice Settings</h2>
        <SaveSettingsButton settings={form.getValues()} />
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Company Information - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyInformationSection control={form.control} />
            </CardContent>
          </Card>

          {/* Payment Details - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentDetailsSettings />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
};

export default InvoiceSettings;
```

### Step 5: Update Default Settings

**File:** `app/components/orders/invoice/hooks/useInvoiceSettings.ts`

Update the default settings object (around line 150):

```tsx
const defaultSettings: InvoiceSettings = {
  // Keep only essential fields
  companyName: 'IVAN PRINTS LIMITED',
  companyEmail: 'sherilox356@gmail.com',
  companyPhone: '+256(0) 755 541 373',
  companyAddress: 'DESIGN.PRINT.BRAND.',
  tinNumber: '1050884489',
  companyLogo: '/images/default-logo.svg',
  
  // Remove all display options except these
  includeHeader: true,
  includeFooter: true,
  includeLogo: false, // Simplified - no logo for now
  includeSignature: false,
  
  // Keep format but set to A5 only
  format: 'a5',
  template: 'standard',
  
  // Remove all item display options
  showItemCategory: false,
  showItemName: true,
  showItemSize: false,
  itemDisplayFormat: 'combined',
  
  // Remove tax/discount
  includeTax: false,
  taxRate: 0,
  includeDiscount: false,
  discountRate: 0,
  
  // Simplified content
  notes: '',
  customHeader: '',
  customFooter: 'Making You Visible',
  
  // Single payment method each
  bankDetails: [{
    id: '1',
    bankName: 'ABSA BANK',
    accountName: 'IVAN PRINTS',
    accountNumber: '6008084570',
  }],
  mobileMoneyDetails: [{
    id: '1',
    provider: 'Airtel',
    phoneNumber: '0755 541 373',
    contactName: 'Wadie Abduli',
  }],
};
```

## Testing Checklist

Before deployment, verify:

- [ ] Invoice preview loads in under 1 second
- [ ] PDF generation completes in under 3 seconds
- [ ] All text is readable in both preview and PDF
- [ ] Table alignment is consistent
- [ ] No overlapping elements
- [ ] Payment details display correctly
- [ ] Orange theme is maintained
- [ ] Print layout works properly
- [ ] No console errors
- [ ] File sizes are under 200 lines

## Performance Metrics

Target improvements:
- Preview render time: < 500ms (from ~2s)
- PDF generation: < 3s (from ~8s)
- Template file size: < 200 lines (from 950)
- Settings UI: < 100 lines (from 400+)

## Rollback Plan

If issues arise:
1. The adapter function ensures backwards compatibility
2. Old settings still work with new template
3. Can revert template file only without breaking settings

## Post-Migration Cleanup

After successful migration (2 weeks):
1. Remove unused settings fields from database
2. Remove complex settings UI components
3. Update documentation
4. Remove adapter function

## DO NOT:
- Create new files
- Add complex features
- Use Tailwind classes in template (use inline styles)
- Add more than one payment method of each type
- Include tax/discount calculations
- Add custom templates or themes

## Success Criteria
- Invoice displays correctly in preview
- PDF matches preview exactly (WYSIWYG)
- Generation is fast and reliable
- Code is simple and maintainable
- No data duplication
- Maintains orange/dark theme consistency