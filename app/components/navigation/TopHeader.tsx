'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/app/context/auth-context';
import { ThemeSwitcher } from '../theme/theme-switcher';

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
};

export default function TopHeader({
  className,
  businessName = 'Ivan Prints',
  appTitle = 'Business Management System',
  userName,
  userInitials,
  userAvatarUrl = '',
  logoUrl = ''
}: TopHeaderProps) {
  // Get user profile information from auth context
  const { profile, isLoading } = useAuth();

  // Use provided values or fallback to profile data
  const displayName = userName || profile?.full_name || 'User';
  const displayInitials = userInitials || getInitials(displayName);

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
      scrolled && "shadow-md backdrop-blur-md bg-card/90 border-b border-border/60",
      !scrolled && "bg-card border-b border-border/40",
      className
    )}>
      <div className="flex items-center">
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
      </div>

      {/* User Info */}
      <div className="ml-auto flex items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-border/40">
            {userAvatarUrl ? (
              <AvatarImage src={userAvatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-r from-primary to-orange-600 text-white">{displayInitials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {greeting}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

