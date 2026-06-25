import { createClient } from '@/utils/supabase/client';

/**
 * Updates the last_sign_in_at field in the profiles table
 * Call this function after a successful sign-in
 */
export async function updateLastSignIn(userId: string): Promise<void> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating last sign in time:', error);
    }
  } catch (error) {
    console.error('Unexpected error updating last sign in time:', error);
  }
}
