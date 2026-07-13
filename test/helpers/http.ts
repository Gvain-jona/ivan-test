import { NextRequest } from 'next/server'

/** GET request with optional query params. */
export function getRequest(path: string, params?: Record<string, string>) {
  const url = new URL(`http://localhost${path}`)
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v)
  return new NextRequest(url)
}

/** JSON-body request (POST by default; pass method for PATCH etc.). */
export function jsonRequest(path: string, body: unknown, method = 'POST') {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** The `{ params }` second argument of dynamic ([id]) route handlers. */
export function routeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) }
}
