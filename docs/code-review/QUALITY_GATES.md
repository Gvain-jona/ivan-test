# Automated Quality Gates — Ivan Prints

Two config files updated: `.eslintrc.json` and `.prettierrc`

---

## ESLint — What's New and Why

### `react-hooks/rules-of-hooks: "error"` (upgraded from missing)
Catches the `useAuth()` call inside JSX conditionals and event handlers found in `SideNav.tsx:311`. This is now a build-blocking error, not a silent bug.

### `no-console: ["warn", { "allow": ["warn", "error"] }]`
`console.log` is allowed in development but flagged in CI. The `app/api/**/*.ts` override makes `console.log` an **error** (not warning) in all API routes — where 47 debug logs were found.

### `max-lines: ["warn", { "max": 200 }]`
Enforces the project's own 200-line rule from `CLAUDE.md`. Currently `useMaterialPurchases.ts` (1159 lines), `analytics-service.ts` (919 lines), and `OrdersTableNew.tsx` (625 lines) would emit warnings. Treat these as a refactoring queue.

### `complexity: ["warn", 10]`
Cyclomatic complexity above 10 warns. `invalidateOrderCache` and `getRevenueByPeriod` both exceed this — the refactored versions in `REFACTORING_GUIDE.md` bring them under 5.

### `@typescript-eslint/no-explicit-any: "warn"` (was missing)
The 74+ `any` types in `app/lib/` will now surface as warnings. Use this as a queue — fix one file per sprint.

### `@typescript-eslint/consistent-type-imports: "error"`
Enforces `import type { Foo }` for type-only imports. Prevents type imports from increasing bundle size.

### `no-eval`, `no-implied-eval`, `no-script-url: "error"`
Security rules. These catch the class of XSS vulnerability found in `auth/verify/route.ts` where template literals were used in a `<script>` block. They don't catch server-side HTML generation but document the intent.

---

## Prettier — What Changed

### `trailingComma: "all"` (was `"es5"`)
`"all"` adds trailing commas to function parameters, which produces cleaner git diffs when adding/removing arguments.

### `endOfLine: "lf"` (added)
Prevents Windows CRLF line endings from polluting git diffs when contributors use Windows machines.

---

## Husky + lint-staged (Already Configured — Verify It's Running)

`package.json` already has:
```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{html,css,json,md}": ["prettier --write"]
}
```
And `"prepare": "husky"`.

**Verify hooks are installed:**
```bash
ls .husky/
# Should contain: pre-commit
cat .husky/pre-commit
# Should run: npx lint-staged
```

If `.husky/pre-commit` is missing:
```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

---

## Required Package Additions for Full ESLint Config

The updated `.eslintrc.json` references `@typescript-eslint` plugins:
```bash
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

---

## CI Integration (Recommended Addition to GitHub Actions)

Add `.github/workflows/quality.yml`:
```yaml
name: Quality Gates
on: [push, pull_request]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      # These currently pass with suppressions — fix the suppressions
      - name: TypeScript
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint

      - name: Prettier
        run: npx prettier --check .
```

**Important:** The `typescript.ignoreBuildErrors: true` in `next.config.js` means `npm run build` passes even with type errors. The `npx tsc --noEmit` step in CI runs the type checker independently, catching errors that `next build` currently hides.

---

## Turning Off Suppressions — Migration Plan

Do NOT remove `ignoreBuildErrors: true` immediately — it will break the build. Instead:

1. Run `npx tsc --noEmit 2>&1 | tee tsc-errors.txt` to see all current errors
2. Assign each error to a sprint for cleanup
3. Once the count reaches zero, remove `ignoreBuildErrors: true` from `next.config.js`
4. Same for `ignoreDuringBuilds: true` with ESLint

Estimated effort: ~2–3 sprints to clear the `any` types and fix the type assertion issues.
