/**
 * Utility functions for handling authentication cookies
 */

/**
 * Extract the project reference ID from the Supabase URL
 * This is used to construct cookie names that match Supabase's format
 */
export function getSupabaseProjectRef(): string | undefined {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    return undefined;
  }
  
  // Extract the project reference from the URL
  // Format: https://[project-ref].supabase.co
  const match = supabaseUrl.match(/(?:\/\/|^)([a-z0-9-]+)\.supabase\.co/);
  const projectRef = match?.[1];
  
  if (!projectRef) {
    console.error('Could not extract project reference from Supabase URL:', supabaseUrl);
  }
  
  return projectRef;
}

/**
 * Get the code verifier cookie name for the current Supabase project
 */
export function getCodeVerifierCookieName(): string {
  const projectRef = getSupabaseProjectRef();
  return `sb-${projectRef}-auth-token-code-verifier`;
}

/**
 * Get the access token cookie name for the current Supabase project
 */
export function getAccessTokenCookieName(): string {
  const projectRef = getSupabaseProjectRef();
  return `sb-${projectRef}-auth-token`;
}

/**
 * Get the refresh token cookie name for the current Supabase project
 */
export function getRefreshTokenCookieName(): string {
  const projectRef = getSupabaseProjectRef();
  return `sb-${projectRef}-auth-token-refresh`;
}

/**
 * Get all Supabase auth cookie names for the current project
 */
export function getAllAuthCookieNames(): string[] {
  const projectRef = getSupabaseProjectRef();
  return [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-refresh`,
    `sb-${projectRef}-auth-token-code-verifier`
  ];
}
