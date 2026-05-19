import type { Category } from '@/lib/categories';

/**
 * Default garments that ship with the app. Cannot be deleted via the admin
 * UI. To add or remove, edit this file. Image paths are relative to /public.
 */
export const SEED_CLOTHES: Array<{
  id: string;
  name: string;
  category: Category;
  description?: string;
  imagePath: string;
  createdAt: string;
}> = [
  {
    id: 'seed-lehnga-1',
    name: 'Multi-panel lehnga choli with embroidered dupatta',
    category: 'lehnga_choli',
    description:
      'Pastel embroidered bodice flowing into a rose-and-jade panelled skirt with a sequinned grid dupatta.',
    imagePath: '/garments/seed-lehnga.svg',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-saree-1',
    name: 'Emerald sequinned saree',
    category: 'saree',
    description:
      'Deep emerald georgette saree with sequinned vine work and a satin choli.',
    imagePath: '/garments/seed-saree.svg',
    createdAt: '2026-01-01T00:00:01.000Z',
  },
];
