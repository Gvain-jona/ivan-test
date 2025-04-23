import { createClient } from '../supabase/client';
import { MigrationRecord } from '../auth/types';

export const migrations = {
  // Add monitoring tables
  async createMonitoringTables() {
    const supabase = createClient();

    // Create error logs table
    await supabase.rpc('create_auth_monitoring_tables', {
      sql: `
        -- Error logs table
        CREATE TABLE IF NOT EXISTS auth_error_logs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          code TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          severity TEXT NOT NULL,
          resolved BOOLEAN DEFAULT false,
          context JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Performance metrics table
        CREATE TABLE IF NOT EXISTS auth_performance_metrics (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          operation TEXT NOT NULL,
          duration FLOAT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          success BOOLEAN NOT NULL,
          context JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Migrations tracking table
        CREATE TABLE IF NOT EXISTS auth_migrations (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          timestamp TIMESTAMPTZ NOT NULL,
          successful BOOLEAN NOT NULL,
          error TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON auth_error_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON auth_error_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON auth_performance_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_metrics_operation ON auth_performance_metrics(operation);
      `
    });
  },

  // Update profiles table
  async updateProfilesTable() {
    const supabase = createClient();

    await supabase.rpc('update_profiles_table', {
      sql: `
        -- Add new columns to profiles
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email',
        ADD COLUMN IF NOT EXISTS auth_version INT DEFAULT 1;

        -- Update existing profiles
        UPDATE profiles
        SET provider = 'email',
            auth_version = 1
        WHERE provider IS NULL;

        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
      `
    });
  },

  // Add RLS policies for monitoring tables
  async addMonitoringPolicies() {
    const supabase = createClient();

    await supabase.rpc('add_monitoring_policies', {
      sql: `
        -- Error logs policies
        ALTER TABLE auth_error_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admins can view all error logs"
        ON auth_error_logs FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );

        -- Performance metrics policies
        ALTER TABLE auth_performance_metrics ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admins can view all metrics"
        ON auth_performance_metrics FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );
      `
    });
  }
};

export async function runMigration(name: string, migrationFn: () => Promise<void>): Promise<void> {
  const supabase = createClient();
  
  try {
    // Check if migration has already been run
    const { data: existingMigration } = await supabase
      .from('auth_migrations')
      .select()
      .eq('name', name)
      .single();

    if (existingMigration?.successful) {
      console.log(`Migration ${name} already completed successfully`);
      return;
    }

    // Run the migration
    await migrationFn();

    // Record successful migration
    await supabase
      .from('auth_migrations')
      .upsert({
        name,
        timestamp: new Date().toISOString(),
        successful: true
      });

    console.log(`Successfully completed migration: ${name}`);
  } catch (error) {
    // Record failed migration
    await supabase
      .from('auth_migrations')
      .upsert({
        name,
        timestamp: new Date().toISOString(),
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

    console.error(`Failed to run migration ${name}:`, error);
    throw error;
  }
}

export async function runAllMigrations(): Promise<void> {
  try {
    await runMigration('create_monitoring_tables', migrations.createMonitoringTables);
    await runMigration('update_profiles_table', migrations.updateProfilesTable);
    await runMigration('add_monitoring_policies', migrations.addMonitoringPolicies);
  } catch (error) {
    console.error('Failed to run all migrations:', error);
    throw error;
  }
}
