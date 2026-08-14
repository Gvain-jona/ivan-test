'use client';

import { useAuth } from '@/app/context/auth-context';
import MobileFeedHeader from '@/components/navigation/MobileFeedHeader';

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

/**
 * Top of the Home feed (H1): the shared org identity row over the time-of-day
 * greeting. The org row is `MobileFeedHeader`, the same top C1/D1/Orders carry,
 * so the four feed screens read as one. The create actions the old hero carried
 * as a search bar now sit in the quick-action chips below, matching the frame.
 */
export default function HomeHero() {
  const { profile, user } = useAuth();
  const name = firstName(profile?.full_name, user?.email);

  return (
    <section className="space-y-4">
      <MobileFeedHeader />
      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
        {getGreeting()}, {name}
      </h1>
    </section>
  );
}
