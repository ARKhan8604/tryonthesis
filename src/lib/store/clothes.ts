import 'server-only';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { cld, cloudinaryEnabled, cloudinaryFolder } from '@/lib/cloudinary';
import type { Category } from '@/lib/categories';
import { CATEGORIES } from '@/lib/categories';

export type Clothing = {
  id: string;
  name: string;
  category: Category;
  description: string | null;
  imageUrl: string;
  isSeed: boolean;
  createdAt: string;
};

const ROOT = process.cwd();

// ────────────────────────────────────────────────────────────────────────────
// Seed defaults — bundled in the build, work on Vercel without any DB.
// Editable via src/data/seed-clothes.ts.
// ────────────────────────────────────────────────────────────────────────────

async function resolveSeedImageUrl(configured: string): Promise<string> {
  const publicDir = path.join(ROOT, 'public');
  const rel = configured.replace(/^\//, '');
  const base = rel.replace(/\.(svg|jpg|jpeg|png)$/i, '');
  for (const ext of ['jpg', 'jpeg', 'png']) {
    try {
      await fs.access(path.join(publicDir, base + '.' + ext));
      return '/' + base + '.' + ext;
    } catch {
      // try next
    }
  }
  return configured;
}

async function loadSeeds(): Promise<Clothing[]> {
  const { SEED_CLOTHES } = await import('@/data/seed-clothes');
  return Promise.all(
    SEED_CLOTHES.map(async (s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description ?? null,
      imageUrl: await resolveSeedImageUrl(s.imagePath),
      isSeed: true,
      createdAt: s.createdAt,
    })),
  );
}

async function readSeedBytes(seedId: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const { SEED_CLOTHES } = await import('@/data/seed-clothes');
  const seed = SEED_CLOTHES.find((s) => s.id === seedId);
  if (!seed) return null;
  const publicDir = path.join(ROOT, 'public');
  const rel = seed.imagePath.replace(/^\//, '');
  const base = rel.replace(/\.(svg|jpg|jpeg|png)$/i, '');
  const candidates = [base + '.jpg', base + '.jpeg', base + '.png', rel];
  for (const c of candidates) {
    try {
      const bytes = await fs.readFile(path.join(publicDir, c));
      return { bytes, mime: guessMime(c) };
    } catch {
      // try next
    }
  }
  return null;
}

function guessMime(p: string): string {
  const ext = path.extname(p).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

// ────────────────────────────────────────────────────────────────────────────
// Cloudinary-backed clothes (admin uploads).
// We use Cloudinary as both blob store *and* metadata store: each image's
// `context` carries the human-readable name + description; tags carry the
// category. The public_id is our row id.
// ────────────────────────────────────────────────────────────────────────────

const NAME_KEY = 'name';
const DESC_KEY = 'description';
const TAG_APP = 'app:desi-tryon';
const TAG_CATEGORY_PREFIX = 'cat:';

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  created_at: string;
  tags?: string[];
  context?: { custom?: Record<string, string> };
};

function resourceToClothing(r: CloudinaryResource): Clothing | null {
  const tags = r.tags ?? [];
  if (!tags.includes(TAG_APP)) return null;
  const catTag = tags.find((t) => t.startsWith(TAG_CATEGORY_PREFIX));
  if (!catTag) return null;
  const category = catTag.slice(TAG_CATEGORY_PREFIX.length) as Category;
  if (!(CATEGORIES as readonly string[]).includes(category)) return null;

  const ctx = r.context?.custom ?? {};
  return {
    id: r.public_id,
    name: ctx[NAME_KEY] || 'Unnamed',
    category,
    description: ctx[DESC_KEY] || null,
    imageUrl: r.secure_url,
    isSeed: false,
    createdAt: r.created_at,
  };
}

async function listCloudinaryClothes(): Promise<Clothing[]> {
  if (!cloudinaryEnabled()) return [];
  try {
    const folder = cloudinaryFolder();
    const result = await cld()
      .search.expression(`folder=${folder}/garments AND tags=${TAG_APP}`)
      .with_field('context')
      .with_field('tags')
      .sort_by('created_at', 'desc')
      .max_results(200)
      .execute();
    const resources = (result.resources ?? []) as CloudinaryResource[];
    return resources.map(resourceToClothing).filter((c): c is Clothing => c !== null);
  } catch (e) {
    console.error('[clothes] cloudinary list failed:', e);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export async function listClothes(): Promise<Clothing[]> {
  const [seeds, cloud] = await Promise.all([loadSeeds(), listCloudinaryClothes()]);
  return [...cloud, ...seeds].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addClothing(input: {
  name: string;
  category: Category;
  description: string | null;
  imageBytes: ArrayBuffer;
  imageMime: string;
}): Promise<Clothing> {
  if (!cloudinaryEnabled()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_* env vars to enable admin uploads.',
    );
  }
  const folder = cloudinaryFolder();
  const dataUri = `data:${input.imageMime};base64,${Buffer.from(input.imageBytes).toString('base64')}`;
  const upload = await cld().uploader.upload(dataUri, {
    folder: `${folder}/garments`,
    resource_type: 'image',
    tags: [TAG_APP, TAG_CATEGORY_PREFIX + input.category],
    context: {
      [NAME_KEY]: input.name,
      ...(input.description ? { [DESC_KEY]: input.description } : {}),
    },
  });

  return {
    id: upload.public_id,
    name: input.name,
    category: input.category,
    description: input.description,
    imageUrl: upload.secure_url,
    isSeed: false,
    createdAt: upload.created_at,
  };
}

export async function deleteClothing(publicId: string): Promise<void> {
  if (!cloudinaryEnabled()) return;
  // Seed ids never reach here; the admin UI hides delete on seeds.
  await cld().uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

/**
 * Fetch the bytes of a garment image so we can hand them to the try-on
 * provider. Works for both seed garments (read from disk) and Cloudinary-
 * hosted ones (fetched via the secure URL).
 */
export async function getClothingImage(
  id: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  // 1) Seed
  if (id.startsWith('seed-')) {
    return readSeedBytes(id);
  }
  // 2) Cloudinary asset — id is the public_id
  if (!cloudinaryEnabled()) return null;
  try {
    const resource = await cld().api.resource(id, { resource_type: 'image' });
    const url = resource.secure_url as string;
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    return { bytes: buf, mime };
  } catch (e) {
    console.error('[clothes] cloudinary fetch failed:', e);
    return null;
  }
}

/**
 * Preset model image bytes (used when the user picks a demo model instead of
 * uploading their own photo). Models always live on disk — they're bundled
 * with the build and don't need Cloudinary.
 */
export async function getModelImage(
  id: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  const { SEED_MODELS } = await import('@/data/seed-models');
  const model = SEED_MODELS.find((m) => m.id === id);
  if (!model) return null;
  const publicDir = path.join(ROOT, 'public');
  const base = path.join(publicDir, model.path).replace(/\.(svg|jpg|jpeg|png)$/i, '');
  const candidates = [
    base + '.jpg',
    base + '.jpeg',
    base + '.png',
    path.join(publicDir, model.path),
  ];
  for (const c of candidates) {
    try {
      const bytes = await fs.readFile(c);
      return { bytes, mime: guessMime(c) };
    } catch {
      // try next
    }
  }
  return null;
}
