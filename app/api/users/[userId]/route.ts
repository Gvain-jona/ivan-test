import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the cookie store and create Supabase client
    const cookieStore = cookies();
    const supabase = await createServerClient(cookieStore);

    // Get user profile
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { message: 'Error fetching user profile' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
