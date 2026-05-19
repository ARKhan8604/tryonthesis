import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type AdminSession } from '@/lib/auth/admin-session';

export const config = {
  matcher: ['/admin/:path*'],
};

export async function proxy(req: NextRequest) {
  // Always allow the login page; everything else under /admin needs a session.
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<AdminSession>(req, res, SESSION_OPTIONS);
  if (session.isAdmin) return res;

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
