'use client';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/clients/useClients';
import { useProducts } from '@/hooks/products/useProducts';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import { normalizeOptions } from '@/lib/fields/options';

interface CustomFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

interface DimensionValue {
  w?: number;
  h?: number;
  raw: string;
}

function DimensionInput({ field, value, onChange, disabled }: CustomFieldInputProps) {
  const dim = (value ?? {}) as Partial<DimensionValue>;

  const update = (patch: Partial<DimensionValue>) => {
    const next = { ...dim, ...patch };
    // Keep raw in sync while both sides are numeric; raw stays
    // directly editable for free-form sizes ("A4", "custom").
    if (('w' in patch || 'h' in patch) && next.w != null && next.h != null) {
      next.raw = `${next.w}x${next.h}`;
    }
    onChange(next.raw || next.w != null || next.h != null ? next : undefined);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        type="number"
        inputMode="decimal"
        placeholder="W"
        className="w-20"
        value={dim.w ?? ''}
        disabled={disabled}
        onChange={e => update({ w: e.target.value === '' ? undefined : Number(e.target.value) })}
        aria-label={`${field.field_label} width`}
      />
      <Input
        type="number"
        inputMode="decimal"
        placeholder="H"
        className="w-20"
        value={dim.h ?? ''}
        disabled={disabled}
        onChange={e => update({ h: e.target.value === '' ? undefined : Number(e.target.value) })}
        aria-label={`${field.field_label} height`}
      />
      <Input
        placeholder="e.g. 2x1m"
        className="min-w-28 flex-1"
        value={dim.raw ?? ''}
        disabled={disabled}
        onChange={e => update({ raw: e.target.value })}
        aria-label={`${field.field_label} raw`}
      />
    </div>
  );
}

function RelationField({ field, value, onChange, disabled }: CustomFieldInputProps) {
  // Hooks must run unconditionally; pause the irrelevant one via a
  // filter that the other entity never matches.
  const isClient = field.related_entity === 'client';
  const isProduct = field.related_entity === 'product';
  const { clients } = useClients(isClient ? { status: 'active', limit: 100 } : { limit: 1 });
  const { products } = useProducts(isProduct ? { status: 'active', limit: 100 } : { limit: 1 });

  if (!isClient && !isProduct) {
    return (
      <Input
        disabled
        value={typeof value === 'string' ? value : ''}
        placeholder={`Unsupported relation: ${field.related_entity ?? 'unknown'}`}
      />
    );
  }

  const options = isClient
    ? clients.map(c => ({ id: c.id, label: c.name }))
    : products.map(p => ({ id: p.id, label: p.name }));

  return (
    <Select
      value={typeof value === 'string' ? value : undefined}
      onValueChange={v => onChange(v || undefined)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Renders one governed custom field from its definition. The DB
 * trigger is the validation authority — this only shapes input; on
 * submit the API surfaces the DB's precise message if a rule fails.
 * Empty values resolve to `undefined` (key omitted), never null — the
 * DB rejects JSON nulls in custom_data by convention.
 */
export function CustomFieldInput(props: CustomFieldInputProps) {
  const { field, value, onChange, disabled } = props;

  switch (field.field_type) {
    case 'number':
      return (
        <Input
          type="number"
          inputMode="decimal"
          value={typeof value === 'number' ? value : ''}
          disabled={disabled}
          onChange={e =>
            onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={e => onChange(e.target.value || undefined)}
        />
      );

    case 'boolean':
      return (
        <Checkbox
          checked={value === true}
          disabled={disabled}
          onCheckedChange={checked => onChange(checked === true ? true : undefined)}
        />
      );

    case 'select': {
      const options = normalizeOptions(field.options);
      return (
        <Select
          value={typeof value === 'string' ? value : undefined}
          onValueChange={v => onChange(v || undefined)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case 'dimension':
      return <DimensionInput {...props} />;

    case 'relation':
      return <RelationField {...props} />;

    case 'text':
    default:
      return (
        <Input
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={e => onChange(e.target.value || undefined)}
        />
      );
  }
}
