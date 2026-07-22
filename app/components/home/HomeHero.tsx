'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

/** Full weekday + date, e.g. "Monday 21 July". */
function longDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Top of the Home feed: date eyebrow, large greeting, a notification
 * bell, and the primary "create order" quick-action bar. Styled after
 * the mobile inspiration set (spacious, rounded, card-on-background),
 * but theme-aware via tokens so it holds in light and dark.
 */
export default function HomeHero() {
  const { profile, user } = useAuth();
  const name = firstName(profile?.full_name, user?.email);
  const avatarInitials = initials(profile?.full_name, user?.email);

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {longDate()}
          </p>
          <h1 className="mt-1.5 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {getGreeting()},
            <br />
            <span className="text-foreground">{name}!</span>
          </h1>
        </div>

        <Link
          href="/dashboard/profile"
          aria-label="Your profile"
          className="flex-shrink-0 rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-border lg:hidden"
        >
          <Avatar className="h-11 w-11 border border-border">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-orange-600 font-semibold text-white">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Primary quick action — styled like a command/search bar. */}
      <Link
        href="/dashboard/orders?new=1"
        className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted"
      >
        <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          Create a new order&hellip;
        </span>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
          <Plus className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
