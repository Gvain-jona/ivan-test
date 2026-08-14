'use client';

import Link from 'next/link';
import { useOrganization as useClerkOrganization } from '@clerk/nextjs';
import { useAuth } from '@/app/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OrgLogo from '@/components/onboarding/OrgLogo';

/** Greeting varies with time of day, matching TopHeader's logic. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** First name only, for a friendlier hero line. Falls back gracefully. */
function firstName(full?: string, email?: string): string {
  if (full && full.trim()) return full.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

/** Up to two initials for the avatar fallback. */
function initials(full?: string, email?: string): string {
  const source = full?.trim() || email?.split('@')[0] || 'U';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Top of the Home feed (H1): the org identity row — logo, business name, and
 * the user's avatar — over the time-of-day greeting. Mobile owns its own top
 * (TopHeader is desktop-only, product decision 2026-07-23), so the org header
 * the canvas draws here lives in the feed rather than in shared chrome. The
 * create actions the old hero carried as a search bar now sit in the quick-
 * action chips below, matching the frame.
 */
export default function HomeHero() {
  const { profile, user } = useAuth();
  const { organization } = useClerkOrganization();
  const name = firstName(profile?.full_name, user?.email);
  const avatarInitials = initials(profile?.full_name, user?.email);
  const orgName = organization?.name ?? 'Your business';

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <OrgLogo size={38} className="rounded-[11px]" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-foreground">
              {orgName}
            </p>
            <p className="truncate text-[11.5px] text-muted-foreground">Business Management</p>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          aria-label="Your profile"
          className="flex-shrink-0 rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-border"
        >
          <Avatar className="h-9 w-9 border border-border">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
            {/* Flat brand pair, not a gradient into a literal orange — the org's
                colour may not be orange, and only this pair has verified contrast. */}
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
        {getGreeting()}, {name}
      </h1>
    </section>
  );
}
