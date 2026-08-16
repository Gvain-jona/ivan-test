'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSheet from '@/components/ui/sheets/AppSheet';
import { CustomFieldsForm } from '@/components/fields/CustomFieldsForm';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { useClientMutations } from '@/hooks/clients/useClients';
import type { Client } from '@/hooks/clients/useClients';
import { useToast } from '@/components/ui/use-toast';

interface ClientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create; a client = edit */
  client: Client | null;
  /** Receives the saved client — lets the order form select it inline. */
  onSaved: (client: Client) => void;
}

/**
 * Create/edit sheet for clients. Only `name` is a fixed column in v2 —
 * phone, type, and everything else are org-defined custom fields from
 * the field registry. Also used inline from the order form for
 * walk-in customers ("+ New client" in the picker).
 */
export default function ClientFormSheet({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormSheetProps) {
  const { toast } = useToast();
  const { fieldDefinitions } = useFieldDefinitions('client');
  const { createClient, updateClient } = useClientMutations();

  const [name, setName] = useState('');
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(client?.name ?? '');
    setCustomData((client?.custom_data as Record<string, unknown>) ?? {});
  }, [open, client]);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const input = {
        name: name.trim(),
        ...(Object.keys(customData).length > 0 && { custom_data: customData }),
      };
      const saved = client
        ? await updateClient(client.id, input)
        : await createClient(input);
      toast({ title: client ? 'Client updated' : 'Client created', description: saved.name });
      onOpenChange(false);
      onSaved(saved);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save client',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={client ? `Edit ${client.name}` : 'New Client'}
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {client ? 'Save Changes' : 'Create Client'}
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-5">
        <div className="space-y-1.5 max-w-md">
          <Label htmlFor="client-name">
            Name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="client-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Kampala Coffee Works"
          />
        </div>

        <CustomFieldsForm fields={fieldDefinitions} value={customData} onChange={setCustomData} />
      </div>
    </AppSheet>
  );
}
