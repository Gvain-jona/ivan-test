import { createClient } from './client';

/**
 * Utility functions for working with Supabase Storage
 */

const supabase = createClient();

const BUCKETS = {
  ORDERS: 'orders',
  PROFILES: 'profiles',
  RECEIPTS: 'receipts',
  MATERIALS: 'materials',
};

/**
 * Initialize storage buckets
 * This should be called during app initialization
 */
export async function initializeStorageBuckets() {
  try {
    console.log('Initializing Supabase storage buckets...');
    
    // Check and create buckets if they don't exist
    for (const bucketName of Object.values(BUCKETS)) {
      const { data: buckets } = await supabase.storage.listBuckets();
      
      const bucketExists = buckets?.find(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: false, // Private by default
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error);
        } else {
          console.log(`✅ Created storage bucket: ${bucketName}`);
        }
      } else {
        console.log(`✓ Storage bucket exists: ${bucketName}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize storage buckets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucketName: string,
  path: string,
  file: File,
  options = { upsert: true }
) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, file, options);
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Get a public URL for a file in Supabase Storage
 */
export function getPublicUrl(bucketName: string, path: string) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucketName: string, path: string) {
  const { error } = await supabase.storage.from(bucketName).remove([path]);
  
  if (error) {
    throw error;
  }
  
  return true;
}

export { BUCKETS }; 