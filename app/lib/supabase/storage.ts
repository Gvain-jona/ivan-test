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
  INVOICES: 'invoices',
  LOGOS: 'logos',
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
        // Make logos bucket public, others private by default
        const isPublic = bucketName === BUCKETS.LOGOS || bucketName === BUCKETS.INVOICES;

        const { error } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
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
 * Ensure a bucket exists before using it
 */
export async function ensureBucketExists(bucketName: string, isPublic = false) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.find(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        return false;
      }
    }

    // If the bucket exists but we need to update its public status
    if (bucketExists) {
      const { error } = await supabase.storage.updateBucket(bucketName, {
        public: isPublic
      });

      if (error) {
        console.error(`Error updating bucket ${bucketName}:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
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
  // Ensure the bucket exists and is properly configured
  await ensureBucketExists(bucketName, bucketName === BUCKETS.LOGOS || bucketName === BUCKETS.INVOICES);

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