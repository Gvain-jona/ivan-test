'use client'

import { User } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'
import { Profile } from '@/app/types/auth'

/**
 * Service for handling profile-related operations
 */
export class ProfileService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Get a user's profile
   */
  async getProfile(userId: string): Promise<{ data: Profile | null, error: any | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      return { data: data as Profile | null, error: null }
    } catch (error) {
      console.error('Error getting profile:', error)
      return { data: null, error }
    }
  }

  /**
   * Fetch or create a user profile
   */
  async fetchOrCreateProfile(user: User): Promise<{ data: Profile | null, error: any | null }> {
    try {
      // First check if we can connect to Supabase
      try {
        const { error: healthError } = await this.supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .maybeSingle()

        // Handle specific errors
        if (healthError) {
          // Ignore 'no rows returned' error
          if (healthError.code === 'PGRST116') {
            if (process.env.NODE_ENV === 'development') {
              console.log('No rows returned from profiles table, continuing...')
            }
          }
          // Ignore RLS policy recursion error
          else if (healthError.code === '42P17' && healthError.message?.includes('infinite recursion detected in policy')) {
            console.error('RLS policy recursion error detected, bypassing profile check')
            return { data: null, error: healthError }
          }
          else {
            console.error('Error connecting to Supabase:', healthError)
            return { data: null, error: healthError }
          }
        }
      } catch (healthError) {
        console.error('Exception connecting to Supabase:', healthError)
        return { data: null, error: healthError }
      }

      // Then check if the profiles table exists
      try {
        const { error: tableError } = await this.supabase
          .from('profiles')
          .select('count')
          .limit(1)

        if (tableError) {
          console.error('Error checking profiles table:', tableError)
          return { data: null, error: tableError }
        }
      } catch (tableError) {
        console.error('Exception checking profiles table:', tableError)
        return { data: null, error: tableError }
      }

      // If the table exists, try to fetch the user's profile
      const { data: existingProfile, error } = await this.getProfile(user.id)

      if (error) {
        // If the profile doesn't exist, we need to create it
        if (error.code === 'PGRST116') { // No rows returned
          return await this.createProfile(user)
        } else {
          console.error('Error fetching profile:', error)
          return { data: null, error }
        }
      }

      return { data: existingProfile, error: null }
    } catch (error) {
      console.error('Exception fetching profile:', error)
      return { data: null, error }
    }
  }

  /**
   * Create a new profile for a user
   */
  async createProfile(user: User): Promise<{ data: Profile | null, error: any | null }> {
    try {
      // First, check if the profile already exists (double-check)
      const { data: existingProfile, error: checkError } = await this.getProfile(user.id)

      if (existingProfile) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Profile already exists, using existing profile:', existingProfile)
        }
        return { data: existingProfile, error: null }
      }

      // Check if the user is in the allowed_emails table and get their role
      const { data: allowedEmail, error: allowedEmailError } = await this.supabase
        .from('allowed_emails')
        .select('role')
        .eq('email', user.email)
        .maybeSingle()

      // Use the role from allowed_emails if available, otherwise default to 'staff'
      const userRole = allowedEmail?.role || 'staff'

      if (process.env.NODE_ENV === 'development') {
        console.log(`Using role from allowed_emails: ${userRole} for user ${user.email}`)
      }

      // Profile doesn't exist, create it
      const { data: newProfile, error: insertError } = await this.supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole, // Use role from allowed_emails
          status: 'active',
          is_verified: false, // They need to set up a PIN
          failed_attempts: 0
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return { data: null, error: insertError }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Created new profile:', newProfile)
      }

      return { data: newProfile, error: null }
    } catch (error) {
      console.error('Exception creating profile:', error)
      return { data: null, error }
    }
  }

  /**
   * Update a user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null, error: any | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }
}
