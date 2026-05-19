import type { Category } from '@/lib/categories';

export type TryOnInput = {
  personBytes: ArrayBuffer;
  personMime: string;
  garmentBytes: ArrayBuffer;
  garmentMime: string;
  category: Category;
};

export type TryOnResult = {
  /** Public URL of the generated try-on image. */
  resultImageUrl: string;
  /** Provider-specific debug info (latency, model id, etc.). */
  meta?: Record<string, unknown>;
};

export interface TryOnProvider {
  readonly name: string;
  generate(input: TryOnInput): Promise<TryOnResult>;
}
