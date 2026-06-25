/**
 * Central registry of every localStorage key used in the application.
 *
 * Rules:
 * - All literal keys live here as STORAGE_KEYS constants.
 * - Dynamic keys (keyed by entity id / type) are produced by factory functions below.
 * - SIGN_OUT_KEYS lists every key that must be cleared when the user signs out.
 */

// ---------------------------------------------------------------------------
// Literal keys
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  // Auth / session (cleared on sign-out)
  AUTH_IN_PROGRESS:    'auth_in_progress',
  AUTH_TIMESTAMP:      'auth_timestamp',
  AUTH_COMPLETED:      'auth_completed',
  AUTH_USER_ID:        'auth_user_id',
  AUTH_EMAIL:          'auth_email',
  AUTH_EMAIL_TEMP:     'auth_email_temp',
  AUTH_REDIRECT_PATH:  'auth_redirect_path',

  // Profile (cleared on sign-out)
  CACHED_USER_PROFILE: 'cached_user_profile',

  // User preferences (cleared on sign-out — may contain account-level data)
  USER_SETTINGS: 'user_settings',

  // System / cache management
  LAST_CACHE_CLEANUP: 'last_cache_cleanup',

  // Dropdown caches
  DROPDOWN_CACHE_CLIENTS:    'dropdown_cache_clients',
  DROPDOWN_CACHE_CATEGORIES: 'dropdown_cache_categories',
  DROPDOWN_CACHE_SIZES:      'dropdown_cache_sizes',
  DROPDOWN_CACHE_SUPPLIERS:  'dropdown_cache_suppliers',

  // Form state (ephemeral — cleared when form is submitted or discarded)
  ORDER_FORM_ACTIVE_TAB: 'order-form-active-tab',
  ORDER_FORM_STATE:      'order-form-state',
  ORDER_FORM_DATA:       'order-form-data',
} as const;

// ---------------------------------------------------------------------------
// Dynamic key factories
// ---------------------------------------------------------------------------

/** Generic SWR-backing cache entries written by lib/cache.ts */
export const getCacheKey = (key: string) => `cache_${key}`;

/** Per-category dropdown item cache written by GlobalDropdownCache.tsx */
export const getDropdownItemsKey = (parentId: string) =>
  `dropdown_cache_items_${parentId}`;

/** Recent-selections cache written by useSmartDropdown / useSmartDropdownCached */
export const getRecentOptionsKey = (entityType: string, parentId?: string) =>
  parentId ? `recent-${entityType}-${parentId}` : `recent-${entityType}`;

/** Per-index payment form state written by InlinePaymentForm.tsx */
export const getPaymentFormKey = (formIndex: number) =>
  `payment-form-${formIndex}`;

/** Item form state (dynamic index) */
export const getItemFormKey = (index: number) => `item-form-${index}`;

/** Note form state (dynamic index) */
export const getNoteFormKey = (index: number) => `note-form-${index}`;

// ---------------------------------------------------------------------------
// Sign-out cleanup
// ---------------------------------------------------------------------------

/**
 * All keys that must be removed when the user signs out.
 * Includes auth flags, PII (email, user ID), profile cache, and preferences.
 * Does NOT include generic SWR caches or form state — those expire on their own.
 */
export const SIGN_OUT_KEYS: readonly string[] = [
  STORAGE_KEYS.AUTH_IN_PROGRESS,
  STORAGE_KEYS.AUTH_TIMESTAMP,
  STORAGE_KEYS.AUTH_COMPLETED,
  STORAGE_KEYS.AUTH_USER_ID,
  STORAGE_KEYS.AUTH_EMAIL,
  STORAGE_KEYS.AUTH_EMAIL_TEMP,
  STORAGE_KEYS.AUTH_REDIRECT_PATH,
  STORAGE_KEYS.CACHED_USER_PROFILE,
  STORAGE_KEYS.USER_SETTINGS,
];

/** Clear all auth and profile keys from localStorage on sign-out. */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  for (const key of SIGN_OUT_KEYS) {
    localStorage.removeItem(key);
  }

  // Clear any Supabase session tokens (sb-auth-token and variants)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('sb-')) {
      localStorage.removeItem(k);
      i--; // adjust index after removal
    }
  }
}
