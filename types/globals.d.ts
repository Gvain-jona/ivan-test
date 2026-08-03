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

  /**
   * Mirrors the same internal_user_id onto the Clerk User resource's
   * public_metadata (source of the session claim above — see
   * app/api/webhooks/clerk/route.ts, which sets this on user.created).
   */
  interface UserPublicMetadata {
    internal_user_id?: string
  }
}
