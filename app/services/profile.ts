import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Profile } from '@/types/profile';

const supabase = createClientComponentClient();

export const getProfile = async (userId: string): Promise<{ profile: Profile | null; error: Error | null }> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { profile, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { profile: null, error: error as Error };
  }
};

export const createProfile = async (profile: Partial<Profile>): Promise<{ profile: Profile | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;

    return { profile: data, error: null };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { profile: null, error: error as Error };
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<{ profile: Profile | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { profile: data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { profile: null, error: error as Error };
  }
};

export const deleteProfile = async (userId: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting profile:', error);
    return { success: false, error: error as Error };
  }
}; 