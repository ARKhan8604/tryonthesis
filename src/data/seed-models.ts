/**
 * Preset model photos shown on the try-on upload page. Users can pick one
 * instead of uploading their own photo.
 *
 * To add more: drop a JPG/PNG in public/models/ and add an entry here.
 * If the imagePath points to a .jpg/.png that doesn't exist, the .svg
 * placeholder will be shown — pop in any real photo at the .jpg path to
 * upgrade it.
 *
 * `name` is shown as the label under the thumbnail.
 * `path` is the path *under* /public used both for display (with leading /)
 *   and for server-side reading (resolved relative to public/).
 */
export const SEED_MODELS: Array<{
  id: string;
  name: string;
  path: string;
  description?: string;
}> = [
  {
    id: 'preset-pink-jacket',
    name: 'Pink jacket, purple wall',
    path: 'models/model-pink-jacket.jpg',
    description: 'Full body, front-facing.',
  },
  {
    id: 'preset-a',
    name: 'Demo model A',
    path: 'models/model-placeholder-a.svg',
    description: 'Replace with your own JPG.',
  },
  {
    id: 'preset-b',
    name: 'Demo model B',
    path: 'models/model-placeholder-b.svg',
    description: 'Replace with your own JPG.',
  },
  {
    id: 'preset-c',
    name: 'Demo model C',
    path: 'models/model-placeholder-c.svg',
    description: 'Replace with your own JPG.',
  },
];
