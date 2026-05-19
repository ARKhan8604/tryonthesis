import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getAdminSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
