import path from 'node:path';
import { promises as fs } from 'node:fs';
import { CATEGORIES, CATEGORY_LABEL, isCategory } from '@/lib/categories';
import { listClothes } from '@/lib/store/clothes';
import { SEED_MODELS } from '@/data/seed-models';
import { TryOnFlow } from './TryOnFlow';

export const dynamic = 'force-dynamic';

async function loadModels() {
  const publicDir = path.join(process.cwd(), 'public');
  return Promise.all(
    SEED_MODELS.map(async (m) => {
      // If a .jpg/.png exists, prefer that over an .svg placeholder.
      const base = m.path.replace(/\.(svg|jpg|jpeg|png)$/i, '');
      const candidates = [base + '.jpg', base + '.jpeg', base + '.png', m.path];
      let displayPath = m.path;
      let isPlaceholder = m.path.endsWith('.svg');
      for (const c of candidates) {
        try {
          await fs.access(path.join(publicDir, c));
          displayPath = c;
          isPlaceholder = c.endsWith('.svg');
          break;
        } catch {
          // try next
        }
      }
      return {
        id: m.id,
        name: m.name,
        imageUrl: '/' + displayPath,
        isPlaceholder,
      };
    }),
  );
}

export default async function TryOnPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const initialCategory = isCategory(params.category) ? params.category : CATEGORIES[0];
  const [clothes, models] = await Promise.all([listClothes(), loadModels()]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Virtual try-on</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Three quick steps. Upload your own photo or pick a demo model.
      </p>

      <TryOnFlow
        initialCategory={initialCategory}
        clothes={clothes}
        models={models}
        categoryLabels={CATEGORY_LABEL}
        categories={CATEGORIES}
      />
    </div>
  );
}
