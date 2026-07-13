'use client'

import { createClient } from '@supabase/supabase-js'
import type { DatabaseV2 } from '@/types/supabase-v2'

/**
 * Browser-side v2-schema client. Same design as server-v2.ts: Clerk
 * owns the session, so the token getter is injected and there is no
 * @supabase/ssr cookie machinery. Layer 2 wires it from Clerk's
 * useSession(), e.g.:
 *
 *   const { session } = useSession()
 *   const supabase = createV2Client(async () => session?.getToken() ?? null)
 *
 * Memoize per session in a hook rather than recreating per render.
 */

type GetToken = () => Promise<string | null>

export function createV2Client(getToken: GetToken) {
  return createClient<DatabaseV2, 'v2'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'v2' },
      accessToken: getToken,
    }
  )
}
