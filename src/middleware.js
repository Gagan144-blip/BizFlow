import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const token    = await getToken({ req })
  const pathname = req.nextUrl.pathname

  const protectedRoutes = ['/dashboard', '/customers', '/services', '/billing']
  const isProtected     = protectedRoutes.some(r => pathname.startsWith(r))

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/customers/:path*', '/services/:path*', '/billing/:path*' , '/settings/:path*']
}