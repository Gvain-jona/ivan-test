'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import {
  useFieldDefinitionMutations,
  FIELD_ENTITIES,
} from '@/hooks/fields/useFieldDefinitions';
import type { FieldDefinition, FieldEntity } from '@/hooks/fields/useFieldDefinitions';
import { useToast } from '@/components/ui/use-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'select', label: 'Select (options)' },
  { value: 'relation', label: 'Relation (link to a record)' },
  { value: 'dimension', label: 'Dimension (W × H / free size)' },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]['value'];

/** "Delivery Date!" -> "delivery_date" (DB machine-key rules). */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 63);
}

interface FieldDefinitionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: FieldEntity;
  /** null = create; a definition = edit */
  field: FieldDefinition | null;
  onSaved: () => void;
}

/**
 * Create/edit sheet for one field definition. The machine key
 * (field_name) is generated from the label and immutable after
 * creation — it's the key stored inside every record's custom_data.
 * Field type is locked on edit for the same reason.
 */
export default function FieldDefinitionFormSheet({
  open,
  onOpenChange,
  entity,
  field,
  onSaved,
}: FieldDefinitionFormSheetProps) {
  const { toast } = useToast();
  const { createField, updateField } = useFieldDefinitionMutations();

  const [label, setLabel] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineNameTouched, setMachineNameTouched] = useState(false);
  const [type, setType] = useState<FieldType>('text');
  const [optionsText, setOptionsText] = useState('');
  const [required, setRequired] = useState(false);
  const [showInDocuments, setShowInDocuments] = useState(false);
  const [group, setGroup] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(field?.field_label ?? '');
    setMachineName(field?.field_name ?? '');
    setMachineNameTouched(!!field);
    setType((field?.field_type as FieldType) ?? 'text');
    setOptionsText(
      Array.isArray(field?.options)
        ? (field.options as unknown[]).filter(o => typeof o === 'string').join('\n')
        : '',
    );
    setRequired(field?.is_required ?? false);
    setShowInDocuments(field?.show_in_documents ?? false);
    setGroup(field?.field_group ?? '');
    setSortOrder(String(field?.sort_order ?? 0));
  }, [open, field]);

  const handleLabelChange = (value: string) => {
    setLabel(value);
    if (!field && !machineNameTouched) setMachineName(slugify(value));
  };

  const options = optionsText
    .split('\n')
    .map(o => o.trim())
    .filter(Boolean);

  const canSubmit =
    label.trim() &&
    (field || /^[a-z][a-z0-9_]{0,62}$/.test(machineName)) &&
    (type !== 'select' || options.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const shared = {
        field_label: label.trim(),
        is_required: required,
        show_in_documents: showInDocuments,
        ...(group.trim() ? { field_group: group.trim() } : {}),
        sort_order: Number(sortOrder) || 0,
        ...(type === 'select' ? { options } : {}),
      };
      if (field) {
        await updateField(field.id, shared);
        toast({ title: 'Field updated' });
      } else {
        await createField({
          entity,
          field_name: machineName,
          field_type: type,
          ...shared,
        });
        toast({ title: 'Field created', description: `${label.trim()} on ${entity}` });
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save field',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const entityLabel = FIELD_ENTITIES.find(e => e.value === entity)?.label ?? entity;

  return (
    <OrderSheet
      open={open}
      onOpenChange={onOpenChange}
      title={field ? `Edit ${field.field_label}` : `New ${entityLabel} Field`}
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
          <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {field ? 'Save Changes' : 'Create Field'}
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="field-label">
              Label<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="field-label"
              value={label}
              onChange={e => handleLabelChange(e.target.value)}
              placeholder="e.g. Delivery Date"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-name">Machine key {field && '(immutable)'}</Label>
            <Input
              id="field-name"
              value={machineName}
              disabled={!!field}
              onChange={e => {
                setMachineNameTouched(true);
                setMachineName(e.target.value);
              }}
              placeholder="delivery_date"
            />
            {!field && (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, underscores. Cannot change after creation.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Type {field && '(immutable)'}</Label>
            <Select
              value={type}
              onValueChange={v => setType(v as FieldType)}
              disabled={!!field}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-group">Group (form section)</Label>
            <Input
              id="field-group"
              value={group}
              onChange={e => setGroup(e.target.value)}
              placeholder="e.g. Fulfilment"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-sort">Sort order</Label>
            <Input
              id="field-sort"
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            />
          </div>
        </div>

        {type === 'select' && (
          <div className="space-y-1.5">
            <Label htmlFor="field-options">
              Options (one per line)<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Textarea
              id="field-options"
              rows={4}
              value={optionsText}
              onChange={e => setOptionsText(e.target.value)}
              placeholder={'Matte\nGlossy\nNone'}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-white">
            <Checkbox checked={required} onCheckedChange={c => setRequired(c === true)} />
            Required
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <Checkbox
              checked={showInDocuments}
              onCheckedChange={c => setShowInDocuments(c === true)}
            />
            Show on documents (invoices/quotes)
          </label>
        </div>
      </div>
    </OrderSheet>
  );
}
