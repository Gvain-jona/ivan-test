'use client';

import { useState, useEffect } from 'react';

// Define the profile type
export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  is_verified: boolean;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
};

/**
 * Hook to get a mock user profile (no authentication required)
 *
 * @returns Mock user profile data
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Return a mock user profile
      setProfile({
        id: '1',
        full_name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        is_verified: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { profile, isLoading, error };
}
