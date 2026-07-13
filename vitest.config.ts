import path from 'node:path'
import { defineConfig } from 'vitest/config'

const r = (p: string) => path.resolve(__dirname, p)

/**
 * Aliases mirror tsconfig.json "paths" — keep the two in sync when a
 * mapping is added there. Specific prefixes first, generic '@/' last.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/components\//, replacement: `${r('app/components')}/` },
      { find: /^@\/lib\//, replacement: `${r('app/lib')}/` },
      { find: /^@\/hooks\//, replacement: `${r('app/hooks')}/` },
      { find: /^@\/utils\//, replacement: `${r('app/utils')}/` },
      { find: /^@\/types\//, replacement: `${r('app/types')}/` },
      { find: /^@\/context\//, replacement: `${r('app/context')}/` },
      { find: /^@\/schemas\//, replacement: `${r('app/schemas')}/` },
      { find: /^@\//, replacement: `${r('.')}/` },
    ],
  },
  test: {
    // Route handlers and lib code run in node. When component/hook
    // tests arrive, add a jsdom project here (npm i -D jsdom
    // @testing-library/react) instead of changing this default —
    // see test/README.md.
    environment: 'node',
    include: ['app/**/*.test.ts', 'test/**/*.test.ts'],
    clearMocks: true,
  },
})
