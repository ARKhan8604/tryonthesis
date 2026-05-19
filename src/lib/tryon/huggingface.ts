import 'server-only';
import { Client } from '@gradio/client';
import type { Category } from '@/lib/categories';
import type { TryOnInput, TryOnProvider, TryOnResult } from './types';

/**
 * Calls a public Hugging Face Space (Gradio) virtual try-on endpoint.
 * Returns the HF-served URL of the generated image directly — we don't
 * re-upload it, since Vercel's filesystem is read-only.
 *
 * Default Space: levihsu/OOTDiffusion. OOTDiffusion's DressCode model
 * (`/process_dc`) is purpose-built for full-body dress try-on and handles
 * source photos with separate-piece outfits (top + pants) more aggressively
 * than Leffa — it replaces the whole body silhouette with the garment
 * rather than swapping a single segmented region.
 *
 * Caveats:
 *  - Anonymous ZeroGPU quota is ~5 min/day per IP. Set HF_TOKEN to lift it.
 *  - Cold start ~30-60s.
 *  - Result URL is hosted by HF and may not be permanent.
 */

// OOTDiffusion DressCode category enum (from the model's config):
//   0 = upper-body
//   1 = lower-body
//   2 = dresses (full-body, single garment)
function ootdCategoryFor(_cat: Category): number {
  // All three desi categories (saree, lehnga choli, anarkali frock) are
  // floor-length silhouettes — DressCode's "dresses" mode (2) is the
  // right setting for all of them. Lehnga choli is two-piece IRL but the
  // VTON model treats it as one full-body garment because the input photo
  // shows it as a single visual unit.
  return 2;
}

export const huggingfaceProvider: TryOnProvider = {
  name: 'huggingface',
  async generate(input: TryOnInput): Promise<TryOnResult> {
    const spaceId = process.env.HF_SPACE_ID || 'levihsu/OOTDiffusion';
    const hfToken = process.env.HF_TOKEN || undefined;

    const started = Date.now();
    const client = await Client.connect(
      spaceId,
      hfToken ? { token: hfToken as `hf_${string}` } : {},
    );

    const personBlob = new Blob([input.personBytes], { type: input.personMime });
    const garmentBlob = new Blob([input.garmentBytes], { type: input.garmentMime });

    // OOTDiffusion /process_dc signature (May 2026):
    // (vton_img, garm_img, category, n_samples, n_steps, image_scale, seed)
    //
    // Param choices:
    //  - category=2 ('dresses'): full-body single garment, the right mode
    //    for sarees / lehngas / anarkalis. Forces the model to dress the
    //    whole body silhouette in the garment rather than swap just the
    //    top region.
    //  - n_samples=1: one image out (we don't show a grid).
    //  - n_steps=30: balanced quality/latency. 20 is the demo default;
    //    50 is sharper but doubles the GPU time we eat from our quota.
    //  - image_scale=2.0: classifier-free guidance scale. Default. Higher
    //    values bias more toward the garment at the cost of pose accuracy.
    //  - seed=-1: random seed each run so users can re-roll on bad output.
    const result = await client.predict('/process_dc', [
      personBlob,
      garmentBlob,
      2, // category
      1, // n_samples
      30, // n_steps
      2.0, // image_scale
      -1, // seed (-1 = random)
    ]);

    const data = result.data as unknown;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Unexpected Gradio response shape');
    }
    // OOTDiffusion returns a gallery (array of items). Take the first.
    const first = data[0];
    let imageRef: { url?: string; path?: string; image?: { url?: string; path?: string } } | string | null = null;
    if (Array.isArray(first) && first.length > 0) {
      imageRef = first[0]?.image ?? first[0] ?? null;
    } else {
      imageRef = first ?? null;
    }
    if (!imageRef) throw new Error('Empty gallery in Gradio response');

    const imageUrl =
      typeof imageRef === 'string'
        ? imageRef
        : imageRef.url ??
          imageRef.image?.url ??
          (imageRef.path
            ? `https://${spaceId.replace('/', '-')}.hf.space/file=${imageRef.path}`
            : imageRef.image?.path
              ? `https://${spaceId.replace('/', '-')}.hf.space/file=${imageRef.image.path}`
              : null);
    if (!imageUrl) throw new Error('No image URL in Gradio response');

    return {
      resultImageUrl: imageUrl,
      meta: {
        provider: 'huggingface',
        spaceId,
        category: ootdCategoryFor(input.category),
        latencyMs: Date.now() - started,
      },
    };
  },
};
