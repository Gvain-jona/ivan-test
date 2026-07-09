import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { DatabaseV2 } from '@/types/supabase-v2'

/**
 * Server-side client scoped to the `v2` schema (order model + tenancy).
 * Every query/RPC through this client defaults to `v2` — no per-call
 * `.schema('v2')` needed. Modules not yet migrated to v2 (expenses,
 * materials, accounts, invoicing, analytics) keep using `./server.ts`
 * against `public` until their turn.
 *
 * Will not resolve anything until `v2` is added to this project's
 * exposed-schemas API setting (Project Settings → API) — as of
 * 2026-07-09 that hasn't been done yet.
 */
export async function createV2Client() {
  const cookieStore = await cookies()

  return createServerClient<DatabaseV2, 'v2'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'v2' },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
