import { createClient } from '@supabase/supabase-js'
import type { DatabaseV2 } from '@/types/supabase-v2'

/**
 * v2-schema clients (order model + tenancy). Auth verdict is Clerk, so
 * unlike ./server.ts there is no Supabase-managed cookie session here:
 * Clerk issues the JWT and supabase-js just presents it via the
 * `accessToken` callback (Supabase third-party auth). RLS reads
 * `organization_id` / `sub` from whatever token the getter returns.
 *
 * The token getter is injected rather than imported from Clerk so this
 * layer has no dependency on the auth provider. In a route handler,
 * Layer 2 wires it as:
 *
 *   import { auth } from '@clerk/nextjs/server'
 *   const supabase = createV2Client(async () => (await auth()).getToken())
 *
 * NOTE: `supabase.auth.*` methods are unavailable on these clients by
 * design (supabase-js disables them when `accessToken` is provided).
 *
 * Still gated on two dashboard items (deferred, per DB owner):
 * `v2` added to Exposed schemas, and Clerk registered as a third-party
 * auth provider so Supabase accepts its JWTs.
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

/**
 * Service-role client: bypasses ALL RLS, so callers must scope every
 * query to an organization_id themselves. Server-side only — never
 * import from a client component. Exists for seeding and for exercising
 * v2 before Clerk is wired (the sanctioned interim per the DB owner).
 */
export function createV2AdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only variable)')
  }

  return createClient<DatabaseV2, 'v2'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      db: { schema: 'v2' },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
