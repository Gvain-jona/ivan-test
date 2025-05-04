'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/app/context/auth-context';
import { ThemeSwitcher } from '../theme/theme-switcher';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '../ui/announcement';
import { Bell, ArrowUpRightIcon, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { useAnnouncement } from '@/app/context/announcement-context';

/**
 * Get initials from a name
 *
 * @param name - Full name
 * @returns Initials (up to 2 characters)
 */
function getInitials(name: string): string {
  if (!name) return 'U';

  const parts = name.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Capitalize the first letter of a string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get a greeting based on the time of day
 *
 * @returns Greeting message
 */
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

type TopHeaderProps = {
  className?: string;
  businessName?: string;
  appTitle?: string;
  userName?: string;
  userInitials?: string;
  userAvatarUrl?: string;
  logoUrl?: string;
  announcement?: {
    show?: boolean;
    tag?: string;
    message?: string;
    link?: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  };
};

export default function TopHeader({
  className,
  businessName = 'Ivan Prints',
  appTitle = 'Business Management System',
  userName,
  userInitials,
  userAvatarUrl = '',
  logoUrl = '',
  announcement: propAnnouncement
}: TopHeaderProps) {
  // Get user profile information from auth context
  const { user, profile, isLoading, profileError, refreshProfile } = useAuth();

  // Use provided values or fallback to profile data
  const displayName = userName || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayInitials = userInitials || getInitials(displayName);

  // State for profile refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use the announcement context
  const {
    activeAnnouncements,
    currentAnnouncement,
    currentIndex
  } = useAnnouncement();

  // Transform the announcement data for display
  const announcement = useMemo(() => {
    // If announcement is provided as a prop, use it
    if (propAnnouncement) {
      return {
        show: propAnnouncement.show ?? true,
        tag: propAnnouncement.tag || 'New',
        message: propAnnouncement.message || 'Announcement',
        link: propAnnouncement.link,
        variant: propAnnouncement.variant || 'info'
      };
    }

    // Otherwise use the current announcement from context
    if (!currentAnnouncement) {
      return {
        show: false,
        tag: '',
        message: '',
        variant: 'info' as const
      };
    }

    return {
      show: true,
      tag: currentAnnouncement.tag,
      message: currentAnnouncement.message,
      link: currentAnnouncement.link,
      variant: currentAnnouncement.variant as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
    };
  }, [propAnnouncement, currentAnnouncement]);

  // Handle profile refresh
  const handleProfileRefresh = async () => {
    if (refreshProfile) {
      setIsRefreshing(true);
      await refreshProfile();
      setTimeout(() => setIsRefreshing(false), 1000); // Show spinner for at least 1 second
    }
  };

  // Get time-based greeting
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  // Update greeting every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Profile Error Alert */}
      {profileError && (
        <Alert variant="destructive" className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between">
          <AlertDescription>
            Unable to load your profile data. This may affect some features.
          </AlertDescription>
          <Button
            size="sm"
            variant="outline"
            onClick={handleProfileRefresh}
            disabled={isRefreshing}
            className="ml-2 bg-background"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Profile
              </>
            )}
          </Button>
        </Alert>
      )}
      <header className={cn(
        "top-header px-4 lg:px-6 sticky top-0 z-20 transition-all duration-200",
        scrolled && "shadow-md backdrop-blur-md bg-[hsl(var(--card))]/90 border-b border-[hsl(var(--border))]/60",
        !scrolled && "bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]/40",
        profileError && "mt-12", // Add margin when error is shown
        className
      )}>
      <div className="flex items-center justify-between w-full">
        {/* Logo and Business Name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 relative">
            <Image
              src={logoUrl || '/images/default-logo.svg'}
              alt={businessName}
              fill
              sizes="(max-width: 768px) 24px, 32px"
              className="object-contain"
              onError={(e) => {
                // Fallback to a colored div if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.style.backgroundColor = '#f97316'; // Orange color
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-foreground">{businessName}</h1>
            <p className="text-xs text-muted-foreground">{appTitle}</p>
          </div>
        </div>

        {/* Center Announcement Badge */}
        {announcement.show && (
          <div className="hidden md:flex justify-center items-center absolute left-1/2 transform -translate-x-1/2">
            <div className="relative min-w-[240px] max-w-[320px]">
              {/* Announcement Content */}
              {announcement.link ? (
                <a
                  href={announcement.link}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 block"
                  onClick={(e) => {
                    if (announcement.link?.startsWith('http')) {
                      e.preventDefault();
                      window.open(announcement.link, '_blank');
                    }
                  }}
                >
                  <Announcement
                    themed
                    variant="outline"
                    className={cn(
                      'animate-pulse-attention hover:animate-none border-black/10 bg-white shadow-md',
                      'hover:bg-white hover:border-black/20',
                      'w-full text-black'
                    )}
                  >
                    <AnnouncementTag className="bg-black text-white">
                      {announcement.tag || 'New'}
                    </AnnouncementTag>
                    <AnnouncementTitle className="text-black">
                      {announcement.message || 'Announcement'}
                      {activeAnnouncements.length > 1 && (
                        <span className="text-xs ml-2 opacity-70">
                          {currentIndex + 1}/{activeAnnouncements.length}
                        </span>
                      )}
                      {announcement.link && <ExternalLink size={14} className="shrink-0 opacity-70 ml-1" />}
                    </AnnouncementTitle>
                  </Announcement>
                </a>
              ) : (
                <div className="cursor-default block">
                  <Announcement
                    themed
                    variant="outline"
                    className={cn(
                      'animate-pulse-attention border-black/10 bg-white shadow-md',
                      'w-full text-black'
                    )}
                  >
                    <AnnouncementTag className="bg-black text-white">
                      {announcement.tag || 'New'}
                    </AnnouncementTag>
                    <AnnouncementTitle className="text-black">
                      {announcement.message || 'Announcement'}
                      {activeAnnouncements.length > 1 && (
                        <span className="text-xs ml-2 opacity-70">
                          {currentIndex + 1}/{activeAnnouncements.length}
                        </span>
                      )}
                    </AnnouncementTitle>
                  </Announcement>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center min-w-[180px] justify-end">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <Avatar className="h-8 w-8 border-2 border-border/40 flex-shrink-0">
            {userAvatarUrl ? (
              <AvatarImage src={userAvatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-r from-primary to-orange-600 text-white">{displayInitials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left flex-shrink-0">
            <p className="text-sm font-medium truncate max-w-[150px]">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {greeting}
            </p>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
