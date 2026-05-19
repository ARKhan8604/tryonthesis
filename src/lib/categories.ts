export const CATEGORIES = ['saree', 'lehnga_choli', 'anarkali'] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  saree: 'Saree',
  lehnga_choli: 'Lehnga Choli',
  anarkali: 'Anarkali Frock',
};

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
