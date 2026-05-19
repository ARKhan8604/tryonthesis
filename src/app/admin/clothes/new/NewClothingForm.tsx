'use client';

import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewClothingForm({
  categories,
}: {
  categories: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.value ?? '');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(f: File | null) {
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    setCompressing(true);
    try {
      // Catalog images can stay higher-res than try-on input photos —
      // they're shown in the picker grid. Cap at 2 MB / 2048 px to fit
      // Vercel's 4.5 MB body limit while keeping sharp thumbnails.
      const compressed = await imageCompression(f, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        initialQuality: 0.9,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } finally {
      setCompressing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Pick an image first.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.set('name', name);
      body.set('category', category);
      body.set('description', description);
      body.set('image', file);
      const res = await fetch('/api/admin/clothes', { method: 'POST', body });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Upload failed');
      }
      router.push('/admin/clothes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <Field label="Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g. Emerald sequined saree"
        />
      </Field>

      <Field label="Category">
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input"
          placeholder="Short note about fabric, occasion, etc."
        />
      </Field>

      <Field label="Image">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-rose-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-rose-800"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="mt-3 max-h-80 rounded-lg border" />
        )}
      </Field>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || compressing}
          className="rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:bg-stone-300"
        >
          {compressing ? 'Optimizing…' : pending ? 'Uploading…' : 'Add garment'}
        </button>
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-stone-300, #d6d3d1);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: rgb(244,63,94); box-shadow: 0 0 0 3px rgba(244,63,94,0.2); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}
