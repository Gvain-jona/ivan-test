'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import { useOrganization } from './useOrganization';
import { settingsBlockPayload, unclearableKeys } from '@/lib/organization/settings-patch';
import type { OrganizationSettingsBlocks } from '@/lib/api/validators';

type BlockName = keyof OrganizationSettingsBlocks;
type BlockValues<B extends BlockName> = NonNullable<OrganizationSettingsBlocks[B]>;

/**
 * Edit one block of organizations.settings as a form.
 *
 * The blocks (locale, tax, documents, identity) are governed DB-side by
 * v2.validate_organization_settings, and PATCH /api/organization merges one
 * level into each named block — so a whole block saves at once and untouched
 * keys survive. That is why this is per-block rather than per-field.
 *
 * Known limit, surfaced rather than worked around: a key that already has a
 * value **cannot be cleared**. Most block strings are `.min(1)`, so sending
 * `''` is a validation error, and omitting the key means "leave it alone".
 * Emptying such a field therefore saves nothing, and `save()` says so instead
 * of reporting a success that didn't happen. Clearing needs the DB-side schema
 * to accept null or empty for those keys.
 */
export function useSettingsBlock<B extends BlockName>(block: B) {
  const { settings, orgRole, isLoading, mutate } = useOrganization();
  const { toast } = useToast();

  // Serialize first, then parse back through a memo: `settings[block]` is a
  // fresh object on every render, which would re-arm both the effect below and
  // the save callback continuously. Keying on the string makes the identity as
  // stable as the value.
  const savedKey = JSON.stringify(settings[block] ?? {});
  const saved = useMemo(() => JSON.parse(savedKey) as BlockValues<B>, [savedKey]);

  const [draft, setDraft] = useState<BlockValues<B>>(saved);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resync when the server value actually changes — on load, and after a save.
  // This does discard an in-flight edit if a background revalidation brings a
  // different value, which is acceptable under owner-only editing and is the
  // same assumption the route's read-modify-write already makes.
  useEffect(() => {
    setDraft(saved);
    setDirty(false);
  }, [saved]);

  const set = useCallback(<K extends keyof BlockValues<B>>(key: K, value: BlockValues<B>[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    const payload = settingsBlockPayload(draft as Record<string, unknown>);
    const cleared = unclearableKeys(saved as Record<string, unknown>, payload);

    setSaving(true);
    try {
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', { settings: { [block]: payload } });
      await mutate();
      toast(
        cleared.length > 0
          ? {
              title: 'Saved, but some fields kept their old value',
              description: `${cleared.join(', ')} can't be emptied yet — set a new value instead.`,
            }
          : { title: 'Saved' },
      );
    } catch (error) {
      toast({
        title: 'Could not save',
        // DB-authored validation messages arrive verbatim and are written to
        // be read by the person who triggered them.
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [block, draft, saved, mutate, toast]);

  return {
    draft,
    set,
    save,
    dirty,
    saving,
    isOwner: orgRole === 'owner',
    isLoading,
  };
}
