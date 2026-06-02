import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

function getSameOriginPath(next: string, requestUrl: string): string {
  try {
    const base = new URL(requestUrl);
    const resolved = new URL(next, base);
    if (resolved.origin !== base.origin) return '/dashboard/orders';
    return resolved.pathname + resolved.search;
  } catch {
    return '/dashboard/orders';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const rawNext = searchParams.get('next') || '/dashboard/orders';

    if (!tokenHash || !type) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error) {
      console.error('Error verifying OTP:', error);
      return NextResponse.redirect(new URL('/auth/signin?error=verification_failed', request.url));
    }

    const safePath = getSameOriginPath(rawNext, request.url);
    return NextResponse.redirect(new URL(safePath, request.url));
  } catch (error) {
    console.error('Error in auth/verify route:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=server_error', request.url));
  }
}
