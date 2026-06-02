# Configuration & Secrets Audit — Ivan Prints

---

## 🚨 Confirmed Plain-Text Secrets (Rotate Immediately)

### S-01 · Sentry DSN Hardcoded in Source
**File:** `sentry.server.config.ts:8`, `sentry.edge.config.ts:8`
```typescript
// CURRENT — secret committed to git
dsn: "https://fffc05fb922efea0351e74ec2cf4b8dc@o4509225001353216.ingest.us.sentry.io/4509225003581440",
```
**Action:**
1. Go to Sentry → Project Settings → Client Keys → Rotate DSN
2. Add new DSN to `.env.local` and production env vars
3. Replace in both files:
```typescript
dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
```

---

### S-02 · Production URL Hardcoded in Auth Utils
**Files:** `app/lib/auth/session-utils.ts:64`, `app/lib/auth/session-utils.new.ts:32`
```typescript
// CURRENT — hardcoded in fallback
? 'https://ivan-test.vercel.app'   // Production URL
```
**Action:** Remove the fallback entirely. `NEXT_PUBLIC_APP_URL` must be set in every environment. The code should fail visibly, not silently use a hardcoded URL.

---

### S-03 · Sentry Org + Project IDs in Source
**File:** `next.config.js:31–33`
```javascript
// CURRENT — org and project names committed
org: "gavinjona",
project: "javascript-nextjs",
```
**Action:** Move to env vars:
```javascript
org: process.env.SENTRY_ORG,
project: process.env.SENTRY_PROJECT,
```

---

## Hardcoded Magic Values (Extract to Config)

### C-01 · Mock User UUID Scattered Across 3 Files
```typescript
// auth-context.tsx:247, SettingsContext.tsx:46, SettingsContext.tsx:140
'00000000-0000-0000-0000-000000000000'
```
**Action:** Delete the mock user entirely (see REFACTORING_GUIDE.md Smell 1B). The UUID check in SettingsContext becomes dead code after removal.

### C-02 · SWR Deduping Interval as Magic Number
```typescript
// useMaterialPurchases.ts:68
dedupingInterval: 5 * 60 * 1000, // 5 minutes
```
**Action:** Extract to `app/lib/cache/constants.ts`:
```typescript
export const CACHE_TTL = {
  DROPDOWN: 10 * 60 * 1000,    // 10 minutes — rarely changes
  LIST: 5 * 60 * 1000,          // 5 minutes — changes on mutations
  DETAIL: 2 * 60 * 1000,        // 2 minutes — changes on mutations
  ANALYTICS: 15 * 60 * 1000,    // 15 minutes — expensive to compute
} as const;
```

### C-03 · Analytics 90-Day Window as Magic Number
```typescript
// analytics-service.ts
const ninetyDaysAgo = subDays(today, 90);
```
**Action:** Add to `app/lib/cache/constants.ts`:
```typescript
export const ANALYTICS = {
  MATERIALIZED_VIEW_WINDOW_DAYS: 90,
  MAX_EXPORT_ROWS: 10_000,
} as const;
```

### C-04 · Pagination Default Limit Inconsistent
Orders route uses `50`, material purchases uses `10`, analytics has no limit:
```typescript
// orders/route.ts:18
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
// useMaterialPurchases.ts:33
pagination: PaginationParams = { page: 1, limit: 10 },
```
**Action:** Add to `app/lib/api/constants.ts`:
```typescript
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
  ANALYTICS_MAX_ROWS: 10_000,
} as const;
```

### C-05 · Google OAuth Scope Hardcoded in Component
```typescript
// app/components/auth/google-button.tsx:27
scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
```
**Action:** Extract to `app/lib/auth/constants.ts`:
```typescript
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');
```

---

## Environment Variable Template

Create `.env.template` (commit this) and add `.env.local` to `.gitignore` (if not already):

```bash
# .env.template
# Copy to .env.local and fill in values. Never commit .env.local

# ─── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server-side only, NEVER expose client-side

# ─── Application ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000          # Production: https://yourdomain.com

# ─── Sentry Error Tracking ─────────────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=your-sentry-project-slug
SENTRY_AUTH_TOKEN=your-sentry-auth-token          # For source map uploads in CI

# ─── Cron / Background Jobs ────────────────────────────────────────────────────
CRON_SECRET=generate-with-openssl-rand-hex-32     # openssl rand -hex 32

# ─── Environment ───────────────────────────────────────────────────────────────
NODE_ENV=development                              # development | production | test
```

---

## `.gitignore` Additions

Verify these are in your `.gitignore`:
```
.env
.env.local
.env.*.local
.env.production
*.pem
*.key
```

---

## Centralized App Config (Recommended Pattern)

Create `app/lib/config.ts` as the single import point for all typed config:

```typescript
// app/lib/config.ts
// All config is read once here. Import from this file, not process.env directly.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  supabase: {
    url:             requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey:         requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    // serviceRoleKey is server-only — import separately in server files
  },
  app: {
    url:             process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    isDev:           process.env.NODE_ENV === 'development',
    isProd:          process.env.NODE_ENV === 'production',
  },
  sentry: {
    dsn:             process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  },
  cron: {
    secret:          process.env.CRON_SECRET,
  },
} as const;
```
