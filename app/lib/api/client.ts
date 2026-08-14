'use client';

/**
 * Client-side API layer for the v2 (multi-tenant) surface.
 * Self-contained on purpose: nothing here touches the legacy
 * endpoints/fetchers, so old modules keep working unmodified and this
 * layer can grow module-by-module as the platform migrates.
 */

export const PLATFORM_API = {
  CLIENTS: '/api/clients',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  FIELD_DEFINITIONS: '/api/field-definitions',
  NOTES: '/api/notes',
  DOCUMENTS: '/api/documents',
  ORGANIZATION: '/api/organization',
  ORGANIZATION_SEED_DEFAULTS: '/api/organization/seed-defaults',
  COUNTERS: '/api/counters',
} as const;

/** Error shape produced by app/lib/api/error-handler.ts. */
export class ApiRequestError extends Error {
  readonly type: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, type: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

async function parseError(response: Response): Promise<ApiRequestError> {
  const body = await response.json().catch(() => null);
  const err = body?.error;
  return new ApiRequestError(
    response.status,
    err?.type ?? 'UNKNOWN',
    // DB-authored validation messages (P0001) arrive here verbatim —
    // they are written to be shown to the user as-is.
    err?.message ?? `Request failed with status ${response.status}`,
    err?.details,
  );
}

export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

/**
 * A mutating request.
 *
 * `body` is optional so DELETE can be sent without one — and when it is
 * omitted no `Content-Type` goes out either, since a header announcing a JSON
 * body that isn't there is the kind of thing a proxy is entitled to reject.
 */
export async function apiRequest<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const hasBody = body !== undefined;
  const response = await fetch(url, {
    method,
    headers: hasBody
      ? { 'Content-Type': 'application/json', Accept: 'application/json' }
      : { Accept: 'application/json' },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

/** Builds `endpoint?a=1&b=2`, skipping undefined/empty params. */
export function buildKey(
  endpoint: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  if (!params) return endpoint;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${endpoint}?${qs}` : endpoint;
}

/** SWR mutate matcher: invalidates every cached key under an endpoint. */
export function keysUnder(endpoint: string) {
  return (key: unknown): boolean => typeof key === 'string' && key.startsWith(endpoint);
}
