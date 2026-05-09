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
  }

  // Posting jobs is client/admin only
  if (nextUrl.pathname.startsWith('/dashboard/jobs/new')) {
    if (role !== 'client' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // Editing profile is talent only
  if (nextUrl.pathname.startsWith('/dashboard/profile')) {
    if (role !== 'talent') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // Setup is admin only
  if (nextUrl.pathname === '/setup') {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl))
    if (role !== 'admin') return NextResponse.redirect(new URL('/', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
