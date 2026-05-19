import { NextRequest, NextResponse } from 'next/server';
import { isCategory } from '@/lib/categories';
import { getClothingImage, getModelImage } from '@/lib/store/clothes';
import { getTryOnProvider } from '@/lib/tryon/provider';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'invalid form' }, { status: 400 });

  const photo = form.get('photo');
  const modelId = String(form.get('modelId') ?? '');
  const garmentId = String(form.get('garmentId') ?? '');
  const category = String(form.get('category') ?? '');

  const hasUpload = photo instanceof File && photo.size > 0;
  if (!hasUpload && !modelId) {
    return NextResponse.json(
      { error: 'either photo or modelId required' },
      { status: 400 },
    );
  }
  if (!garmentId) {
    return NextResponse.json({ error: 'garmentId required' }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 });
  }

  const garment = await getClothingImage(garmentId);
  if (!garment) {
    return NextResponse.json({ error: 'garment not found' }, { status: 404 });
  }

  let personBytes: ArrayBuffer;
  let personMime: string;
  if (hasUpload) {
    personBytes = await (photo as File).arrayBuffer();
    personMime = (photo as File).type || 'image/jpeg';
  } else {
    const model = await getModelImage(modelId);
    if (!model) {
      return NextResponse.json({ error: 'model not found' }, { status: 404 });
    }
    personBytes = new Uint8Array(model.bytes).buffer as ArrayBuffer;
    personMime = model.mime;
  }
  try {
    const provider = getTryOnProvider();
    const result = await provider.generate({
      personBytes,
      personMime,
      garmentBytes: new Uint8Array(garment.bytes).buffer as ArrayBuffer,
      garmentMime: garment.mime,
      category,
    });
    return NextResponse.json({
      resultImageUrl: result.resultImageUrl,
      provider: provider.name,
      meta: result.meta,
    });
  } catch (e) {
    console.error('[tryon] failed:', e);
    const message = e instanceof Error ? e.message : 'try-on failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
