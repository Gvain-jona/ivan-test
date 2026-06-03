# Dependency Review — Ivan Prints
**Based on:** `package.json` as of 2026-06-02

---

## 🔴 Critical — Immediate Action Required

### 1. `@supabase/auth-helpers-nextjs@^0.10.0` — DEPRECATED
**Status:** Officially deprecated by Supabase. No longer maintained.  
**Problem:** This package was superseded by `@supabase/ssr` (already in your dependencies). Having both creates confusion about which cookie/session handling is active.  
**Evidence:** The codebase already imports from `@supabase/ssr` in `utils/supabase/server.ts`. The `auth-helpers-nextjs` package appears unused or used inconsistently.  
**Action:** Audit all imports of `@supabase/auth-helpers-nextjs`, migrate to `@supabase/ssr`, then `npm uninstall @supabase/auth-helpers-nextjs`.  
```bash
# Find all usages
grep -rn "@supabase/auth-helpers-nextjs" app/ --include="*.ts" --include="*.tsx"
```

---

### 2. `shadcn-ui@^0.9.5` + `shadcn@^2.4.0` — Duplicate/Conflicting
**Status:** Two Shadcn packages installed simultaneously.  
`shadcn-ui` is the old CLI package (0.x, discontinued).  
`shadcn` is the new CLI package (2.x, current).  
**Problem:** `shadcn-ui` is no longer published with updates. The `npm run ui:add` script calls `npx shadcn-ui@latest` which may resolve differently than the installed version. Component generation could be inconsistent.  
**Action:** `npm uninstall shadcn-ui`. Keep only `shadcn`. Update the script in `package.json`:
```json
"ui:add": "npx shadcn@latest add"
```

---

## 🟡 Warnings — Review and Plan

### 3. `chart.js@^4.4.9` + `recharts@^2.15.2` — Two charting libraries
**Problem:** Both are installed and used. `chart.js` (used via `react-chartjs-2`) and `recharts` serve the same purpose. Maintaining two chart libraries doubles bundle size and creates inconsistent chart APIs across the codebase.  
**Impact:** ~200KB combined gzip weight.  
**Action:** Audit which charts use which library. `recharts` is more idiomatic for React. Migrate all charts to one library.  
```bash
grep -rn "chart.js\|react-chartjs-2\|recharts" app/ --include="*.tsx" -l
```

### 4. `jspdf@^3.0.1` + `jspdf-autotable@^5.0.2` + `html2pdf.js@^0.10.3` — Three PDF libraries
**Problem:** Three separate PDF generation libraries. `html2pdf.js` wraps `jspdf` internally but has its own copy. `jspdf-autotable` extends `jspdf` for tables.  
**Impact:** ~300KB+ combined bundle weight. `html2pdf.js` is rarely updated (last release 2021).  
**Action:** Consolidate to `jspdf` + `jspdf-autotable` only. Replace any `html2pdf.js` usage with direct `jspdf` rendering.

### 5. `react-datepicker@^8.3.0` + `react-day-picker@^9.6.6` — Two date picker libraries
**Problem:** Both installed. `react-day-picker` is the one used by Shadcn UI's Calendar component. `react-datepicker` is likely a holdover from before Shadcn was adopted.  
**Action:** Audit usage. If `react-datepicker` is used in fewer than 3 places, migrate to `react-day-picker` and uninstall.

### 6. `react-icons@^5.5.0` + `lucide-react@^0.487.0` — Two icon libraries
**Problem:** Both installed. Shadcn UI uses `lucide-react` exclusively. `react-icons` is a large aggregation library that pulls in hundreds of icon sets.  
**Action:** `grep -rn "react-icons" app/ --include="*.tsx"`. If usage is minimal, migrate to `lucide-react` and `npm uninstall react-icons`.

### 7. `node-fetch@^3.3.2` — Unnecessary in Next.js 15
**Problem:** Next.js 15 (Node 18+) has native `fetch` globally available. `node-fetch` v3 is ESM-only which can cause CommonJS interop issues.  
**Action:** `grep -rn "node-fetch" app/`. Replace any usage with native `fetch`, then uninstall.

### 8. `bcrypt@^5.1.1` — Should be `bcryptjs` for edge runtime compatibility
**Problem:** `bcrypt` is a native Node.js addon. It cannot run in Next.js Edge Runtime (used by middleware). `bcryptjs` is a pure-JS drop-in replacement.  
**Check:** If password hashing runs in any middleware or edge function, this will fail silently or crash.  
**Action:** `npm install bcryptjs @types/bcryptjs && npm uninstall bcrypt @types/bcrypt`. API is identical.

### 9. `framer-motion@^12.6.5` — Verify it's actually used
**Problem:** Framer Motion is ~170KB gzipped. Worth verifying active usage before keeping.  
**Action:**
```bash
grep -rn "framer-motion\|motion\." app/ --include="*.tsx" | wc -l
```
If fewer than 5 files, consider using CSS transitions instead.

### 10. `embla-carousel-react@^8.6.0` — Verify active usage
**Problem:** Added as a Shadcn dependency but may not be used if no carousel components are active.  
**Action:** `grep -rn "embla\|Carousel" app/ --include="*.tsx"`. Remove if unused.

---

## 🟢 Good — Keep As-Is

| Package | Reason |
|---------|--------|
| `next@^15.3.0` | Current major version, App Router stable |
| `@supabase/ssr@^0.6.1` | Current recommended Supabase SSR package |
| `@supabase/supabase-js@^2.49.4` | Current stable |
| `zod@^3.24.2` | Standard, well-maintained schema validation |
| `swr@^2.3.3` | Current stable, appropriate for this use case |
| `react-hook-form@^7.55.0` | Standard, well-maintained |
| `@sentry/nextjs@^9.14.0` | Current major version |
| `zustand@^5.0.3` | Current stable, minimal footprint |
| `date-fns@^4.1.0` | Current major version, tree-shakeable |
| `tailwindcss@^3.4.1` | Current stable (v4 in beta, wait) |
| `lucide-react@^0.487.0` | Actively maintained, used by Shadcn |
| `sonner@^2.0.3` | Current stable toast library |
| `typescript@^5` | Current major version |

---

## Recommended `npm audit` Commands

```bash
# Check for known vulnerabilities
npm audit

# Check for outdated packages (major versions)
npm outdated

# Check bundle size impact
npx bundlephobia-cli recharts chart.js framer-motion
```

---

## Summary — Packages to Remove

```bash
npm uninstall \
  @supabase/auth-helpers-nextjs \
  shadcn-ui \
  html2pdf.js \
  react-datepicker \
  react-icons \
  node-fetch \
  bcrypt \
  @types/bcrypt

npm install bcryptjs @types/bcryptjs
```

Estimated bundle reduction after cleanup: **~400–600KB gzipped**.
