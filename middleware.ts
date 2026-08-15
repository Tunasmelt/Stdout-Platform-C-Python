import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Route groups like `(student)` never appear in the resolved URL — matching against
// them here is a no-op. List the real, resolved path prefixes instead.
const STUDENT_ROUTE_PREFIXES = ['/dashboard', '/assessment', '/tracks']

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isStudentRoute = STUDENT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  // Route protection — authentication only. Teacher-role enforcement for /admin
  // happens in app/(teacher)/admin/layout.tsx (a server component with its own
  // getUser() + profiles.role check), so it isn't duplicated here.
  if (pathname.startsWith('/admin') || isStudentRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
