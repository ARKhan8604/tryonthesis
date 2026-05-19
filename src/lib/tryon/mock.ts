import 'server-only';
import type { TryOnInput, TryOnProvider, TryOnResult } from './types';

/**
 * No-op provider. Returns a 1×1 transparent PNG data URL as the "result"
 * after a short delay. Used for offline dev (no Cloudinary or HF calls).
 */
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=';

export const mockProvider: TryOnProvider = {
  name: 'mock',
  async generate(_input: TryOnInput): Promise<TryOnResult> {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      resultImageUrl: TRANSPARENT_PIXEL,
      meta: {
        provider: 'mock',
        note: 'Mock provider returns a 1×1 placeholder. Switch TRYON_PROVIDER=huggingface to run the real model.',
      },
    };
  },
};
