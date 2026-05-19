import Link from 'next/link';
import { NewClothingForm } from './NewClothingForm';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories';

export default function NewClothingPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin/clothes" className="text-sm text-stone-500 hover:underline">
        ← Back to catalogue
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Add a garment</h1>
      <p className="mt-1 text-sm text-stone-600">
        Upload a clean image — flat-lay or mannequin, plain background. This works
        much better than editorial photos with a model.
      </p>
      <NewClothingForm
        categories={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
      />
    </div>
  );
}
