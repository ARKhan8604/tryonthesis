import 'server-only';
import { Client } from '@gradio/client';
import type { TryOnInput, TryOnProvider, TryOnResult } from './types';

/**
 * Calls a public Hugging Face Space (Gradio) virtual try-on endpoint.
 * Returns the HF-served URL of the generated image directly — we don't
 * re-upload it (Vercel's filesystem is read-only at runtime).
 *
 * Default Space: franciszzj/Leffa. As of May 2026, Leffa is the only
 * fully-callable free VTON Space — OOTDiffusion / IDM-VTON / CatVTON /
 * StableVITON are all in 503 error state. Kolors is up but doesn't expose
 * Gradio API discovery.
 *
 * Caveats:
 *  - Anonymous ZeroGPU quota is ~5 min/day per IP. Set HF_TOKEN to lift it.
 *  - Cold start ~30-60s.
 *  - Result URL is hosted by HF and may not be permanent.
 *  - VTON is fundamentally garment-region swap, not outfit replacement.
 *    Best results come from source photos where the person is in
 *    close-fitting basic clothing (leggings + camisole, swim, etc).
 */
export const huggingfaceProvider: TryOnProvider = {
  name: 'huggingface',
  async generate(input: TryOnInput): Promise<TryOnResult> {
    const spaceId = process.env.HF_SPACE_ID || 'franciszzj/Leffa';
    const hfToken = process.env.HF_TOKEN || undefined;

    const started = Date.now();
    const client = await Client.connect(
      spaceId,
      hfToken ? { token: hfToken as `hf_${string}` } : {},
    );

    const personBlob = new Blob([input.personBytes], { type: input.personMime });
    const garmentBlob = new Blob([input.garmentBytes], { type: input.garmentMime });

    // Leffa /leffa_predict_vt signature:
    // (src_image, ref_image, ref_acceleration, step, scale, seed,
    //  vt_model_type, vt_garment_type, vt_repaint)
    //
    // Param choices, tuned aggressively for full-outfit replacement on
    // desi floor-length garments:
    //  - vt_model_type 'dress_code': DressCode dataset, full-body dresses.
    //  - vt_garment_type 'dresses': cue the model to treat the garment as
    //    full-body rather than upper-body.
    //  - vt_repaint=false: critical — this disables the "preserve non-mask
    //    pixels" pass that was leaving the source photo's jeans intact.
    //    Tradeoff: face/skin can drift slightly because the model is now
    //    generating the whole image rather than inpainting just one region.
    //  - step=50: sharper sequin/embroidery detail. ~15s extra latency.
    //  - scale=3.5: higher guidance pushes the model harder toward the
    //    garment, at some cost to pose fidelity. Default is 2.5.
    const result = await client.predict('/leffa_predict_vt', [
      personBlob,
      garmentBlob,
      false, // ref_acceleration
      50, // step
      3.5, // scale (was 2.5; more aggressive garment imposition)
      42, // seed
      'dress_code', // vt_model_type
      'dresses', // vt_garment_type
      false, // vt_repaint  ← disabled so the model rewrites the whole body
    ]);

    const data = result.data as unknown;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Unexpected Gradio response shape');
    }
    const first = data[0] as { url?: string; path?: string } | string;
    const imageUrl =
      typeof first === 'string'
        ? first
        : first.url ??
          (first.path
            ? `https://${spaceId.replace('/', '-')}.hf.space/file=${first.path}`
            : null);
    if (!imageUrl) throw new Error('No image URL in Gradio response');

    return {
      resultImageUrl: imageUrl,
      meta: { provider: 'huggingface', spaceId, latencyMs: Date.now() - started },
    };
  },
};
