'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/app/context/auth-context';
import { ThemeSwitcher } from '../theme/theme-switcher';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '../ui/announcement';
import { Bell, ArrowUpRightIcon, ExternalLink } from 'lucide-react';

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
  announcement = {
    show: true,
    tag: 'Updated',
    message: 'Order system updated',
    link: '/dashboard/orders',
    variant: 'info'
  }
}: TopHeaderProps) {
  // Get user profile information from auth context
  const { user, profile, isLoading } = useAuth();

  // Use provided values or fallback to profile data
  const displayName = userName || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayInitials = userInitials || getInitials(displayName);

  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state in TopHeader:', { user, profile, isLoading });
  }, [user, profile, isLoading]);

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
    <header className={cn(
      "top-header px-4 lg:px-6 sticky top-0 z-20 transition-all duration-200",
      scrolled && "shadow-md backdrop-blur-md bg-[hsl(var(--card))]/90 border-b border-[hsl(var(--border))]/60",
      !scrolled && "bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]/40",
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
            <a 
              href={announcement.link} 
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95 min-w-[240px] max-w-[320px]"
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
                  <ExternalLink size={14} className="shrink-0 opacity-70" />
                </AnnouncementTitle>
              </Announcement>
            </a>
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
  );
}
