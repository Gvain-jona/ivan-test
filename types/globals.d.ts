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
    /**
     * The org's brand colour preset id, from
     * org.public_metadata.brand_color — same "Customize session token"
     * mechanism as internal_user_id. Typed as string because a claim is
     * untrusted input; isBrandPresetId() narrows it. See
     * app/lib/theme/brand.ts.
     */
    brand_color?: string
  }

  /**
   * Mirrors the same internal_user_id onto the Clerk User resource's
   * public_metadata (source of the session claim above — see
   * app/api/webhooks/clerk/route.ts, which sets this on user.created).
   */
  interface UserPublicMetadata {
    internal_user_id?: string
  }

  /**
   * Clerk Organization public_metadata. Clerk owns org visual identity
   * (name, slug, logo), so the brand colour lives here rather than in
   * v2.organizations — see app/lib/theme/brand.ts for the rationale.
   */
  interface OrganizationPublicMetadata {
    brand_color?: string
  }
}
