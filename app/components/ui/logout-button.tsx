'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getBaseUrl } from '@/app/lib/auth/session-utils';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  className = '',
  showIcon = true,
  text = 'Logout'
}: LogoutButtonProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('Logging out user...');
      
      // Clear PIN verification cookie and localStorage
      document.cookie = 'pin_verified=; Max-Age=0; path=/; secure; samesite=lax';
      
      // Clear any local storage items we might have set
      const keysToRemove = [
        'pin_verified_at',
        'auth_email',
        'auth_email_temp',
        'auth_completed',
        'auth_timestamp',
        'auth_user_id',
        'auth_in_progress'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore localStorage errors
        }
      });
      
      // Get the base URL for the current environment
      const baseUrl = getBaseUrl();
      const signInUrl = `${baseUrl}/auth/signin`;
      
      console.log('Will redirect to:', signInUrl);
      
      // Sign out from Supabase using the auth context
      const { success, error } = await signOut();
      
      if (!success || error) {
        console.error('Error signing out:', error);
        throw new Error(error || 'Failed to sign out');
      }
      
      console.log('User logged out successfully');
      
      // Redirect to sign in page with the correct base URL
      window.location.href = signInUrl;
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
      
      // If there was an error, still try to redirect to sign in
      setTimeout(() => {
        const baseUrl = getBaseUrl();
        window.location.href = `${baseUrl}/auth/signin`;
      }, 1000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${isLoggingOut ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          {showIcon && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Signing out...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {text}
        </>
      )}
    </Button>
  );
}
