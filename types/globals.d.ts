export {}

declare global {
  /**
   * Clerk session-token custom claims. `internal_user_id` is the
   * app-internal UUID (v2 user id), set from Clerk
   * public_metadata.internal_user_id via the dashboard's
   * "Customize session token" config. See app/lib/auth/tenant.ts.
   */
  interface CustomJwtSessionClaims {
    internal_user_id?: string
  }
}
