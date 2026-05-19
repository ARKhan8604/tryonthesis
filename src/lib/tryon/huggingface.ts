import 'server-only';
import { Client } from '@gradio/client';
import type { TryOnInput, TryOnProvider, TryOnResult } from './types';

/**
 * Calls a public Hugging Face Space (Gradio) virtual try-on endpoint.
 * Returns the HF-served URL of the generated image directly — we don't
 * re-upload it, since Vercel's filesystem is read-only and the user
 * picked "HF URLs directly" for the result-storage question.
 *
 * Default Space: franciszzj/Leffa.
 *
 * Caveats:
 *  - Anonymous ZeroGPU quota is ~5 min/day. Set HF_TOKEN to lift it.
 *  - Cold start ~30-60s.
 *  - The returned URL is hosted by HF and may not be permanent.
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

    // Leffa /leffa_predict_vt signature (May 2026):
    // (src_image, ref_image, ref_acceleration, step, scale, seed,
    //  vt_model_type, vt_garment_type, vt_repaint)
    //
    // Param choices, tuned for desi full-length garments (saree, lehnga,
    // anarkali — all floor-length):
    //  - vt_model_type 'dress_code' (not 'viton_hd'): the DressCode dataset
    //    contains full-body dresses, so the model knows how to extend a
    //    garment all the way to the ankle/floor. viton_hd is trained on
    //    cropped upper-body catalogue shots and produces mini-skirt-length
    //    output for sarees.
    //  - vt_repaint=true: keeps face, skin tone, hair and background pixels
    //    from the source photo intact; only the garment region is repainted.
    //  - step=50 (up from 30): better detail in the sequin / embroidery work
    //    on traditional garments. Adds ~10-15s latency per request.
    const result = await client.predict('/leffa_predict_vt', [
      personBlob,
      garmentBlob,
      false, // ref_acceleration
      50, // step
      2.5, // scale
      42, // seed
      'dress_code', // vt_model_type
      'dresses', // vt_garment_type
      true, // vt_repaint
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
