'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Announcement } from '@/app/types/announcements';
import { API_ENDPOINTS } from '@/app/lib/api-endpoints';

interface AnnouncementContextType {
  activeAnnouncements: Announcement[];
  currentAnnouncement: Announcement | null;
  refreshAnnouncements: () => Promise<void>;
  isLoading: boolean;
  currentIndex: number;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActiveAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);

      // Use cache-busting query parameter to ensure we get fresh data
      const cacheBuster = new Date().getTime();
      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS}?_=${cacheBuster}`);

      if (!response.ok) {
        console.error('Failed to fetch announcements');
        return;
      }

      const data = await response.json();

      // Filter for active announcements that are within their date range
      const now = new Date();
      const activeAnnouncements = data.filter((announcement: Announcement) => {
        if (!announcement.is_active) return false;

        const startDate = announcement.start_date ? new Date(announcement.start_date) : null;
        const endDate = announcement.end_date ? new Date(announcement.end_date) : null;

        return (!startDate || startDate <= now) && (!endDate || endDate >= now);
      });

      console.log('Active announcements:', activeAnnouncements);

      setActiveAnnouncements(activeAnnouncements);
      setCurrentIndex(0); // Reset index when new data is loaded
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchActiveAnnouncements();
  }, [fetchActiveAnnouncements]);

  // Cycle through announcements if there are multiple
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeAnnouncements.length);
    }, 8000); // Cycle every 8 seconds

    return () => clearInterval(intervalId);
  }, [activeAnnouncements.length]);

  // Get the current announcement
  const currentAnnouncement = activeAnnouncements[currentIndex] || null;

  return (
    <AnnouncementContext.Provider
      value={{
        activeAnnouncements,
        currentAnnouncement,
        refreshAnnouncements: fetchActiveAnnouncements,
        isLoading,
        currentIndex
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
}
