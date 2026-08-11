'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { CustomFieldInput } from './CustomFieldInput';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import { isFieldVisible, type CustomDataValue } from '@/lib/fields/visibility';

export type { CustomDataValue };

interface CustomFieldsFormProps {
  /** Active definitions for one entity, from useFieldDefinitions. */
  fields: FieldDefinition[];
  /** The record's custom_data object. */
  value: CustomDataValue;
  /** Called with the FULL next custom_data object (handoff rule). */
  onChange: (next: CustomDataValue) => void;
  disabled?: boolean;
}

/**
 * Renders an entity's governed custom fields from its
 * field_definitions registry, grouped by field_group and ordered by
 * sort_order. Values follow the omit-empty convention: clearing a
 * field removes its key entirely (never null). Validation lives in
 * the DB trigger; submit errors carry its precise message.
 */
export function CustomFieldsForm({ fields, value, onChange, disabled }: CustomFieldsFormProps) {
  const groups = useMemo(() => {
    const visible = fields.filter(f => f.status === 'active' && isFieldVisible(f, value));
    const byGroup = new Map<string, FieldDefinition[]>();
    for (const field of visible) {
      const group = field.field_group ?? '';
      const list = byGroup.get(group) ?? [];
      list.push(field);
      byGroup.set(group, list);
    }
    return [...byGroup.entries()];
  }, [fields, value]);

  const setField = (fieldName: string, fieldValue: unknown) => {
    const next = { ...value };
    if (fieldValue === undefined) {
      delete next[fieldName];
    } else {
      next[fieldName] = fieldValue;
    }
    onChange(next);
  };

  if (fields.length === 0) return null;

  return (
    <div className="space-y-6">
      {groups.map(([groupName, groupFields]) => (
        <fieldset key={groupName || '_default'} className="space-y-4">
          {groupName && (
            <legend className="text-sm font-medium text-muted-foreground">{groupName}</legend>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groupFields.map(field => (
              <div key={field.field_name} className="space-y-1.5">
                <Label htmlFor={`cf-${field.field_name}`}>
                  {field.field_label}
                  {field.is_required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <CustomFieldInput
                  field={field}
                  value={value[field.field_name]}
                  onChange={v => setField(field.field_name, v)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
