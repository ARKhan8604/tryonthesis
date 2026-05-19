import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type AdminSession = {
  isAdmin?: boolean;
};

export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.ADMIN_SESSION_SECRET ?? 'dev-only-replace-me-with-32-chars-min',
  cookieName: 'desi-tryon-admin',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getAdminSession() {
  const store = await cookies();
  return getIronSession<AdminSession>(store, SESSION_OPTIONS);
}

export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session.isAdmin === true;
}
