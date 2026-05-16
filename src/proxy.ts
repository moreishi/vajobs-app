import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  // Redirect logged-in users away from login/register
  if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // All dashboard routes require authentication
  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }

    // Guests must pick a role before accessing the dashboard
    if (role === 'guest' && nextUrl.pathname !== '/dashboard/choose-role' && nextUrl.pathname !== '/dashboard/onboarding') {
      return NextResponse.redirect(new URL('/dashboard/choose-role', nextUrl))
    }
  }

  // Posting jobs is client/admin only
  if (nextUrl.pathname.startsWith('/dashboard/jobs/new') || nextUrl.pathname.match(/^\/dashboard\/jobs\/[\w-]+\/edit$/)) {
    if (role !== 'client' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // Editing talent profile is talent only
  if (nextUrl.pathname.startsWith('/dashboard/profile')) {
    if (role !== 'talent') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // Editing client profile is client/admin only
  if (nextUrl.pathname.startsWith('/dashboard/client-profile')) {
    if (role !== 'client' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // Setup is admin only
  if (nextUrl.pathname === '/setup') {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl))
    if (role !== 'admin') return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Admin dashboard is admin only
  if (nextUrl.pathname.startsWith('/dashboard/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl))
    if (role !== 'admin') return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
