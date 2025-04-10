/**
 * Database Initialization Script
 *
 * This script handles connecting to the Supabase database and
 * running any necessary setup. It should be executed during app startup.
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Create admin client for Supabase operations
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Initialize the database
 * - Tests the connection
 * - Verifies the schema exists
 * - Runs migrations if schema does not exist in development
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Testing database connection...');

    // Test the connection by fetching a single user
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Database connection error:', error);

      // If in development and the error is related to schema or missing table,
      // we might need to run migrations
      if (IS_DEVELOPMENT &&
          (error.message.includes('relation') ||
           error.message.includes('does not exist'))) {
        console.log('⚠️ Schema issue detected, attempting to run migrations...');
        await runMigrations();
      } else {
        throw error;
      }
    } else {
      console.log('✅ Database connection successful');

      // Check if we have basic seed data
      const { count } = await adminClient
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (count === 0 && IS_DEVELOPMENT) {
        console.log('⚠️ No users found, running seed data...');
        await runMigrations(true);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run database migrations
 * @param resetDatabase - Whether to completely reset the database (development only)
 */
async function runMigrations(resetDatabase = false) {
  if (!IS_DEVELOPMENT) {
    console.log('🔒 Running migrations in production - using schema SQL files');
    await executeSqlMigrations();
    return;
  }

  const execPromise = promisify(exec);

  try {
    if (resetDatabase) {
      console.log('🗑️ Resetting database...');
      await execPromise('supabase db reset');
    } else {
      console.log('🔄 Pushing schema changes...');
      await execPromise('supabase db push');
    }
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Execute SQL migrations in production
 * This would typically use the SQL files directly rather than
 * relying on the Supabase CLI which is not available in production
 */
async function executeSqlMigrations() {
  // In a production environment, you would:
  // 1. Read the SQL migration files
  // 2. Execute them against the database
  // 3. Track migration status

  console.log('📝 Production migration execution placeholder');
  // Implementation would depend on your production setup
}

/**
 * Reset the database in development mode
 * This is useful for testing and development
 */
export async function resetDatabase() {
  if (!IS_DEVELOPMENT) {
    throw new Error('Database reset is only available in development mode');
  }

  await runMigrations(true);
  return { success: true };
}

// Add a function to verify RLS policies are correctly applied
export async function verifyRlsPolicies() {
  if (!IS_DEVELOPMENT) {
    return { success: true }; // Skip in production
  }

  try {
    console.log('🔍 Verifying Row Level Security policies...');

    // Get list of tables
    const { data: tables, error: tablesError } = await adminClient.rpc('get_tables');

    if (tablesError) {
      throw tablesError;
    }

    // Check if RLS is enabled for each table
    for (const table of tables) {
      const { data: rlsEnabled, error: rlsError } = await adminClient.rpc(
        'check_rls_enabled',
        { table_name: table.table_name }
      );

      if (rlsError) {
        throw rlsError;
      }

      if (!rlsEnabled) {
        console.warn(`⚠️ RLS not enabled for table: ${table.table_name}`);
      }
    }

    console.log('✅ RLS verification completed');
    return { success: true };
  } catch (error) {
    console.error('❌ RLS verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}