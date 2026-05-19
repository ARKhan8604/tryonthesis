import Link from 'next/link';
import { CATEGORY_LABEL } from '@/lib/categories';
import { listClothes } from '@/lib/store/clothes';
import { DeleteButton } from './DeleteButton';
import { LogoutButton } from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminClothesPage() {
  const clothes = await listClothes();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clothing catalogue</h1>
          <p className="mt-1 text-sm text-stone-600">
            Add, browse and remove the garments users can try on.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/clothes/new"
            className="rounded-full bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-800"
          >
            + Add garment
          </Link>
          <LogoutButton />
        </div>
      </div>

      {clothes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">
          Nothing here yet. Add your first garment.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {clothes.map((c) => (
            <div
              key={c.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              <div className="relative aspect-[3/4] bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {c.isSeed && (
                  <span className="absolute left-2 top-2 rounded-full bg-stone-900/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-stone-500">{CATEGORY_LABEL[c.category]}</p>
                </div>
                {c.isSeed ? (
                  <span className="text-xs text-stone-400">Bundled</span>
                ) : (
                  <DeleteButton id={c.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
