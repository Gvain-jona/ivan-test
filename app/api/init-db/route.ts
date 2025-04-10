import { NextResponse } from 'next/server';
import { initializeSupabaseSchema } from '../../lib/supabase/init';

// This API route is used to initialize the Supabase database
// It should only be called during development or initial setup
export async function POST() {
  try {
    // Only allow in development to prevent accidental initialization in production
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This route is only available in development environment' },
        { status: 403 }
      );
    }

    const result = await initializeSupabaseSchema();

    if (result.success) {
      return NextResponse.json({ message: 'Database initialized successfully' }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize database', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error initializing database:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 