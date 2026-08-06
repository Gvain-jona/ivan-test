'use client';

import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

/**
 * Clerk's sign-in card, following the app theme.
 *
 * The appearance lives here rather than on <ClerkProvider> so that provider
 * can stay a server component in the root layout — wrapping it in a client
 * component to read useTheme() would drop Clerk's server-rendered initial
 * state and flash a signed-out UI. <SignIn /> is the only Clerk UI component
 * this app renders, so scoping the override to it costs nothing.
 *
 * resolvedTheme is undefined until mount, so the very first paint uses the
 * light card and settles a frame later in dark mode. Gating the whole card on
 * a `mounted` flag instead would trade that for a blank space, which reads
 * worse on the one screen a signed-out user ever sees.
 */
export default function ThemedSignIn() {
  const { resolvedTheme } = useTheme();

  return (
    <SignIn
      path="/auth/signin"
      fallbackRedirectUrl="/dashboard/orders"
      appearance={resolvedTheme === 'dark' ? { theme: dark } : undefined}
    />
  );
}
