import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase session in middleware
 * This function handles cookie management for authentication
 * 
 * @param request - The Next.js request object
 * @returns A NextResponse with updated session cookies
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session if it exists
  // This is important for keeping the user's session alive
  const { data: { user } } = await supabase.auth.getUser()

  // If there's no user and the route is protected, redirect to sign-in
  // This is handled by the middleware.ts file, so we just return the response here
  
  return response
}

