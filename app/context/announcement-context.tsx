'use client';

import { createContext, useContext } from 'react';
import type { Announcement } from '@/app/types/announcements';

interface AnnouncementContextType {
  activeAnnouncements: Announcement[];
  currentAnnouncement: Announcement | null;
  refreshAnnouncements: () => Promise<void>;
  isLoading: boolean;
  currentIndex: number;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

/**
 * Interface-preserving stub, like NotificationsContext before the v2
 * notifications rebuild (STATE.md).
 *
 * Announcements are a legacy `public.announcements` feature that went dark at
 * the Clerk swap: the route runs an unauthenticated query against a table the
 * dead Supabase session can no longer reach, and its writes still gate on the
 * dead `profiles.role === 'admin'`. The old provider fetched it on every
 * dashboard load — one guaranteed-failing request per navigation. Until an
 * announcements v2 cutover this holds the shape (TopHeader's banner still
 * mounts and simply finds nothing) without the dead request.
 */
const EMPTY: AnnouncementContextType = {
  activeAnnouncements: [],
  currentAnnouncement: null,
  refreshAnnouncements: async () => {},
  isLoading: false,
  currentIndex: 0,
};

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  return <AnnouncementContext.Provider value={EMPTY}>{children}</AnnouncementContext.Provider>;
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
}
