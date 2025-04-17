import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/unified-server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * This API route enables public access to the database
 * It applies RLS policies that allow anyone to read data without authentication
 *
 * DEVELOPMENT USE ONLY
 */

// Define a GET handler that returns a 404 in production
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Define the POST handler
export async function POST() {
  try {
    // Only allow in development to prevent accidental changes in production
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This route is only available in development environment' },
        { status: 403 }
      );
    }

    // Get the Supabase client
    const supabase = await createClient();

    // Read the public access SQL migration
    console.log('Applying public access policies...');
    const migrationPath = path.join(process.cwd(), 'app/lib/supabase/migrations/public_access.sql');

    // Check if the file exists
    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      return NextResponse.json(
        { error: 'Migration file not found' },
        { status: 500 }
      );
    }

    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migration });

    if (error) {
      console.error('Error applying public access policies:', error);
      return NextResponse.json(
        { error: 'Failed to apply public access policies', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Public access policies applied successfully');

    return NextResponse.json(
      { message: 'Public access enabled successfully' },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error enabling public access:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
