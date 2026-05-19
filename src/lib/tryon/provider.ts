import { mockProvider } from './mock';
import { huggingfaceProvider } from './huggingface';
import type { TryOnProvider } from './types';

export function getTryOnProvider(): TryOnProvider {
  const name = process.env.TRYON_PROVIDER ?? 'mock';
  switch (name) {
    case 'huggingface':
      return huggingfaceProvider;
    case 'mock':
    default:
      return mockProvider;
  }
}
