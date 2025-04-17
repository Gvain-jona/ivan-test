import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminUser } from '../../lib/supabase/admin';

/**
 * This API route is used to initialize the admin user
 * It should only be called during development or initial setup
 *
 * DEVELOPMENT USE ONLY
 */

// Define a GET handler that returns a 405 Method Not Allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Define the POST handler
export async function POST(request: NextRequest) {
  try {
    // Only allow in development to prevent accidental initialization in production
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This route is only available in development environment' },
        { status: 403 }
      );
    }

    // Get admin credentials from request body
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email and PIN are required' },
        { status: 400 }
      );
    }

    const result = await initializeAdminUser(email, pin);

    if (result.success) {
      return NextResponse.json(
        { message: 'Admin user initialized successfully', userId: result.userId },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize admin user', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error initializing admin user:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}