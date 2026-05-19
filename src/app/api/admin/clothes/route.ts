import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin-session';
import { isCategory } from '@/lib/categories';
import { addClothing, deleteClothing } from '@/lib/store/clothes';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'invalid form' }, { status: 400 });

  const name = String(form.get('name') ?? '').trim();
  const category = String(form.get('category') ?? '');
  const description = String(form.get('description') ?? '').trim() || null;
  const image = form.get('image');

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  if (!isCategory(category))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 });
  if (!(image instanceof File) || image.size === 0)
    return NextResponse.json({ error: 'image required' }, { status: 400 });

  const bytes = await image.arrayBuffer();
  try {
    const c = await addClothing({
      name,
      category,
      description,
      imageBytes: bytes,
      imageMime: image.type || 'image/jpeg',
    });
    return NextResponse.json({ ok: true, id: c.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'add failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteClothing(id);
  return NextResponse.json({ ok: true });
}
