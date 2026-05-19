import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD not set on the server' },
      { status: 500 },
    );
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
