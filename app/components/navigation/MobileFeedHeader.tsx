'use client';

import Link from 'next/link';
import { useOrganization as useClerkOrganization } from '@clerk/nextjs';
import { useAuth } from '@/app/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OrgLogo from '@/components/onboarding/OrgLogo';

/** Up to two initials for the avatar fallback. */
function initials(full?: string, email?: string): string {
  const source = full?.trim() || email?.split('@')[0] || 'U';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * The mobile feed screens' shared top: the org identity row (logo + business
 * name) and the user's avatar, exactly as the canvas draws it on H1, A2/B1, C1
 * and D1.
 *
 * On mobile every screen owns its own top (TopHeader is desktop-only, product
 * decision 2026-07-23) — this is the shared realisation of that row so the four
 * feed screens don't each hand-roll it, and it is `lg:hidden` because desktop
 * already carries the same identity in TopHeader.
 */
export default function MobileFeedHeader() {
  const { profile, user } = useAuth();
  const { organization } = useClerkOrganization();
  const name = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const orgName = organization?.name ?? 'Your business';

  return (
    <div className="mb-4 flex items-center justify-between gap-4 lg:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <OrgLogo size={38} className="rounded-[11px]" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-foreground">{orgName}</p>
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
            {initials(profile?.full_name, user?.email)}
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}
