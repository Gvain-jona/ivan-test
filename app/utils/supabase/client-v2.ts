import { createBrowserClient } from '@supabase/ssr'
import type { DatabaseV2 } from '@/types/supabase-v2'

/**
 * Browser-side client scoped to the `v2` schema. See server-v2.ts for
 * why this exists as a sibling to client.ts rather than a replacement.
 */
export function createV2Client() {
  return createBrowserClient<DatabaseV2, 'v2'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'v2' },
    }
  )
}
