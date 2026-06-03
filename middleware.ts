import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './app/utils/supabase/middleware'

const PUBLIC_PREFIXES = ['/auth/', '/api/healthz']

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (!user && !isPublic) {
    const signIn = new URL('/auth/signin', request.url)
    signIn.searchParams.set('next', pathname)
    return NextResponse.redirect(signIn)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}
