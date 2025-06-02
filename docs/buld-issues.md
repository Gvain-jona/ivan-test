 npm run build

> ivan-prints@0.1.0 build
> next build

Environment Variables:
NEXT_PUBLIC_SUPABASE_URL: https://giwurfpxxktfsdyitgvr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY available: true
Next.js Config: {
  "reactStrictMode": false,
  "poweredByHeader": false,
  "typescript": {
    "ignoreBuildErrors": true
  },
  "eslint": {
    "ignoreDuringBuilds": true
  },
  "images": {
    "domains": [],
    "dangerouslyAllowSVG": true,
    "contentDispositionType": "attachment",
    "contentSecurityPolicy": "default-src 'self'; script-src 'none'; sandbox;",
    "unoptimized": false
  },
  "trailingSlash": false,
  "logging": {
    "level": "verbose",
    "fetches": {
      "fullUrl": true
    }
  },
  "onDemandEntries": {
    "maxInactiveAge": 3600000,
    "pagesBufferLength": 5
  }
}
   ▲ Next.js 15.3.0
   - Environments: .env.local, .env.production, .env
   - Experiments (use with caution):
     · clientTraceMetadata

   Creating an optimized production build ...
 ⚠ Found lockfile missing swc dependencies, patching...
 ⚠ Lockfile was successfully patched, please run "npm install" to ensure @next/swc dependencies are downloaded
<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (245kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
 ✓ Compiled successfully in 3.4min
   Skipping validation of types
   Skipping linting
   Collecting page data  .(node:21588) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:22732) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
   Collecting page data  .(node:2696) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 ✓ Collecting page data    
Error occurred prerendering page "/api/dropdown/sizes". Read more: https://nextjs.org/docs/messages/prerender-error
PageNotFoundError: Cannot find module for page: /api/dropdown/sizes/route
    at getPagePath (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\server\require.js:88:15)
    at requirePage (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\server\require.js:93:22)
    at loadComponentsImpl (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\server\load-components.js:132:57)
    at async exportPageImpl (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:163:24)
    at async Span.traceAsyncFn (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\trace\trace.js:157:20)
    at async exportPage (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:357:18)
    at async exportPageWithRetry (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:247:26)
    at async Promise.all (index 0)
    at async Object.exportPages (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:334:31)
Export encountered an error on /api/dropdown/sizes/route: /api/dropdown/sizes, exiting the build.
Error occurred prerendering page "/auth/callback". Read more: https://nextjs.org/docs/messages/prerender-error
PageNotFoundError: Cannot find module for page: /auth/callback/route
    at getPagePath (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\server\require.js:88:15)
    at requirePage (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\server\require.js:93:22)
    at loadComponentsImpl (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\server\load-components.js:132:57)
    at async exportPageImpl (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:163:24)
    at async Span.traceAsyncFn (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\trace\trace.js:157:20)
    at async exportPage (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:357:18)
    at async exportPageWithRetry (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:247:26)
    at async Promise.all (index 0)
    at async Object.exportPages (D:\Projects\WEB\Ivan\Ivan- V2\node_modules\next\dist\export\worker.js:334:31)
Export encountered an error on /auth/callback/route: /auth/callback, exiting the build.
 ⨯ Next.js build worker exited with code: 1 and signal: null