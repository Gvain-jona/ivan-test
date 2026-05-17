import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Restrict this diagnostic endpoint to development only
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Server Component
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Server Component
            }
          }
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const { data, error: tableCheckError } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1);

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      authenticated: !userError && !!user,
      tableExists: !tableCheckError,
      data: data || null,
    });
  } catch (error: any) {
    console.error('Error in invoice settings test endpoint:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
