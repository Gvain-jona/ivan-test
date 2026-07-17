/**
 * One-time Clerk user backfill for the auth transition.
 *
 * For every user in v2.organization_members:
 *   1. Resolve their email from Supabase auth.users (service role).
 *   2. Find-or-create the matching Clerk user by email.
 *   3. Set Clerk public_metadata.internal_user_id to the existing
 *      Supabase auth.users UUID — the session-token claim the app
 *      reads (see app/lib/auth/tenant.ts). This is what makes the
 *      seeded organization_members rows work under Clerk with no
 *      remap.
 *
 * Idempotent: safe to re-run; existing correct metadata is skipped,
 * a conflicting value is reported and NOT overwritten (resolve by
 * hand — it means two identities claim the same email).
 *
 * Usage:  node scripts/clerk-backfill.js [--dry-run]
 * Needs in .env.local: CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const CLERK_API = 'https://api.clerk.com/v1';
const DRY_RUN = process.argv.includes('--dry-run');

const { CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

if (!CLERK_SECRET_KEY) fail('CLERK_SECRET_KEY missing from .env.local');
if (!NEXT_PUBLIC_SUPABASE_URL) fail('NEXT_PUBLIC_SUPABASE_URL missing from .env.local');
if (!SUPABASE_SERVICE_ROLE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY missing from .env.local');

async function clerk(path, options = {}) {
  const res = await fetch(`${CLERK_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.errors?.map(e => e.message).join('; ') || res.statusText;
    throw new Error(`Clerk ${options.method || 'GET'} ${path} → ${res.status}: ${detail}`);
  }
  return body;
}

async function findClerkUserByEmail(email) {
  const users = await clerk(`/users?email_address=${encodeURIComponent(email)}`);
  return Array.isArray(users) && users.length > 0 ? users[0] : null;
}

async function main() {
  const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: 'v2' },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: members, error } = await admin
    .from('organization_members')
    .select('user_id, organization_id, role');
  if (error) fail(`Could not read v2.organization_members: ${error.message}`);
  const userIds = [...new Set(members.map(m => m.user_id))];
  console.log(`Found ${members.length} membership rows, ${userIds.length} distinct users.${DRY_RUN ? ' (dry run)' : ''}\n`);

  const results = [];
  for (const userId of userIds) {
    const row = { userId, email: null, clerkId: null, action: null };
    results.push(row);
    try {
      const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(userId);
      if (authErr || !authUser?.user?.email) {
        row.action = `SKIP — no auth.users email (${authErr?.message || 'not found'})`;
        continue;
      }
      const email = authUser.user.email;
      row.email = email;

      let clerkUser = await findClerkUserByEmail(email);
      if (!clerkUser) {
        if (DRY_RUN) {
          row.action = 'WOULD CREATE Clerk user + set internal_user_id';
          continue;
        }
        clerkUser = await clerk('/users', {
          method: 'POST',
          body: JSON.stringify({
            email_address: [email],
            public_metadata: { internal_user_id: userId },
            skip_password_requirement: true,
          }),
        });
        row.clerkId = clerkUser.id;
        row.action = 'CREATED with internal_user_id';
        continue;
      }

      row.clerkId = clerkUser.id;
      const existing = clerkUser.public_metadata?.internal_user_id;
      if (existing === userId) {
        row.action = 'OK — already set';
      } else if (existing) {
        row.action = `CONFLICT — has internal_user_id=${existing}, expected ${userId}. NOT touched.`;
      } else if (DRY_RUN) {
        row.action = 'WOULD SET internal_user_id';
      } else {
        await clerk(`/users/${clerkUser.id}/metadata`, {
          method: 'PATCH',
          body: JSON.stringify({ public_metadata: { internal_user_id: userId } }),
        });
        row.action = 'UPDATED — internal_user_id set';
      }
    } catch (e) {
      row.action = `ERROR — ${e.message}`;
    }
  }

  console.log('Result:');
  for (const r of results) {
    console.log(`  ${r.email || r.userId}  →  ${r.action}${r.clerkId ? `  (clerk: ${r.clerkId})` : ''}`);
  }

  const bad = results.filter(r => r.action?.startsWith('ERROR') || r.action?.startsWith('CONFLICT'));
  if (bad.length) {
    console.error(`\n${bad.length} user(s) need attention.`);
    process.exit(1);
  }
  console.log('\nDone.');
}

main().catch(e => fail(e.message));
