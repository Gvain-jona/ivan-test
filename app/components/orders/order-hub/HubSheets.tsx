'use client';

import AddItemSheet from '@/components/orders/sheets/AddItemSheet';
import AddPaymentSheet from '@/components/orders/sheets/AddPaymentSheet';
import AddNoteSheet from '@/components/orders/sheets/AddNoteSheet';
import DiscountSheet from '@/components/orders/sheets/DiscountSheet';
import IssueDocumentSheet from '@/components/orders/sheets/IssueDocumentSheet';
import type { DraftItem } from '@/lib/orders/draft';
import type { useOrderHub } from './useOrderHub';

export type OpenSheet = 'item' | 'payment' | 'note' | 'discount' | 'issue' | null;

/**
 * The hub's five sheets, mounted together.
 *
 * They are all open/closed from one `sheet` value, so only one can ever be up
 * — stacking a payment over an item edit would leave two surfaces both
 * claiming to be the thing you're doing.
 */
export function HubSheets({
  sheet,
  setSheet,
  hub,
  editingItem,
}: {
  sheet: OpenSheet;
  setSheet: (next: OpenSheet) => void;
  hub: ReturnType<typeof useOrderHub>;
  editingItem: DraftItem | null;
}) {
  return (
    <>
      <AddItemSheet
        open={sheet === 'item'}
        onOpenChange={open => setSheet(open ? 'item' : null)}
        editing={editingItem}
        busy={hub.busy}
        onAdd={item =>
          editingItem ? hub.updateItem(editingItem.key, item) : hub.addItem(item)
        }
        onRemove={
          editingItem
            ? async () => {
                await hub.removeItem(editingItem.key);
                setSheet(null);
              }
            : undefined
        }
      />
      <AddPaymentSheet
        open={sheet === 'payment'}
        onOpenChange={open => setSheet(open ? 'payment' : null)}
        balance={hub.balance}
        onAdd={hub.addPayment}
      />
      <AddNoteSheet
        open={sheet === 'note'}
        onOpenChange={open => setSheet(open ? 'note' : null)}
        onAdd={note => hub.addNote(note.content, note.custom_data)}
      />
      <DiscountSheet
        open={sheet === 'discount'}
        onOpenChange={open => setSheet(open ? 'discount' : null)}
        subtotal={hub.subtotal}
        discount={hub.discount}
        onApply={hub.setDiscount}
      />
      <IssueDocumentSheet
        open={sheet === 'issue'}
        onOpenChange={open => setSheet(open ? 'issue' : null)}
        subtotal={hub.subtotal}
        discountAmount={hub.discountAmount}
        total={hub.total}
        busy={hub.busy}
        onIssue={async input => {
          await hub.issue(input);
          setSheet(null);
        }}
      />
    </>
  );
}
