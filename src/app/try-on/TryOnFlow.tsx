'use client';

import { useMemo, useState } from 'react';
import type { Category } from '@/lib/categories';
import { PoseGuide } from './PoseGuide';

type Clothing = {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
};

type ModelPreset = {
  id: string;
  name: string;
  imageUrl: string;
  isPlaceholder: boolean;
};

type Step = 'upload' | 'pick' | 'generating' | 'result';
type Source =
  | { kind: 'upload'; file: File; previewUrl: string }
  | { kind: 'preset'; modelId: string; imageUrl: string; name: string };

export function TryOnFlow({
  initialCategory,
  clothes,
  models,
  categoryLabels,
  categories,
}: {
  initialCategory: Category;
  clothes: Clothing[];
  models: ModelPreset[];
  categoryLabels: Record<Category, string>;
  categories: readonly Category[];
}) {
  const [step, setStep] = useState<Step>('upload');
  const [category, setCategory] = useState<Category>(initialCategory);
  const [source, setSource] = useState<Source | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Clothing | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredClothes = useMemo(
    () => clothes.filter((c) => c.category === category),
    [clothes, category],
  );

  function onPhotoSelected(file: File | null) {
    setError(null);
    if (source?.kind === 'upload') URL.revokeObjectURL(source.previewUrl);
    if (file) {
      setSource({ kind: 'upload', file, previewUrl: URL.createObjectURL(file) });
    } else {
      setSource(null);
    }
  }

  function pickPreset(m: ModelPreset) {
    if (m.isPlaceholder) {
      setError(
        `${m.name} is a placeholder. Drop a real JPG at public/${m.imageUrl.replace(/^\//, '').replace(/\.svg$/, '.jpg')} to use it.`,
      );
      return;
    }
    setError(null);
    if (source?.kind === 'upload') URL.revokeObjectURL(source.previewUrl);
    setSource({
      kind: 'preset',
      modelId: m.id,
      imageUrl: m.imageUrl,
      name: m.name,
    });
  }

  function continueFromUpload() {
    if (!source) {
      setError('Pick a photo or a demo model first.');
      return;
    }
    setError(null);
    setStep('pick');
  }

  async function generate(g: Clothing) {
    if (!source) return;
    setSelectedGarment(g);
    setStep('generating');
    setError(null);
    setResultUrl(null);
    try {
      const body = new FormData();
      if (source.kind === 'upload') body.set('photo', source.file);
      else body.set('modelId', source.modelId);
      body.set('garmentId', g.id);
      body.set('category', g.category);
      const res = await fetch('/api/tryon', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Try-on failed');
      setResultUrl(data.resultImageUrl);
      setStep('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try-on failed');
      setStep('pick');
    }
  }

  function startOver() {
    if (source?.kind === 'upload') URL.revokeObjectURL(source.previewUrl);
    setStep('upload');
    setSource(null);
    setSelectedGarment(null);
    setResultUrl(null);
    setError(null);
  }

  const sourcePreview =
    source?.kind === 'upload' ? source.previewUrl : source?.imageUrl ?? null;
  const sourceLabel =
    source?.kind === 'preset' ? source.name : source?.kind === 'upload' ? 'Your photo' : null;

  return (
    <div className="mt-8">
      <Stepper step={step} />

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-6 text-center">
              {sourcePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sourcePreview}
                  alt={sourceLabel ?? 'Selected photo'}
                  className="mx-auto max-h-72 rounded-lg object-contain"
                />
              ) : (
                <p className="text-sm text-stone-500">JPG or PNG, full body, plain background</p>
              )}
              <p className="mt-2 text-xs text-stone-500">{sourceLabel ?? ' '}</p>
              <input
                type="file"
                accept="image/*"
                className="mt-4 block w-full text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-rose-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-rose-800"
                onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
              />
            </div>

            <p className="mt-6 text-sm font-medium text-stone-700">…or pick a demo model</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {models.map((m) => {
                const active = source?.kind === 'preset' && source.modelId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickPreset(m)}
                    className={`group overflow-hidden rounded-lg border-2 transition ${
                      active
                        ? 'border-rose-600 ring-2 ring-rose-200'
                        : m.isPlaceholder
                          ? 'border-dashed border-stone-300 opacity-70 hover:opacity-100'
                          : 'border-stone-200 hover:border-stone-400'
                    }`}
                    title={m.name + (m.isPlaceholder ? ' (placeholder)' : '')}
                  >
                    <div className="relative aspect-[3/4] bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={continueFromUpload}
              disabled={!source}
              className="mt-6 rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Continue
            </button>
          </div>
          <PoseGuide />
        </div>
      )}

      {step === 'pick' && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  c === category
                    ? 'bg-rose-700 text-white'
                    : 'bg-white text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
              >
                {categoryLabels[c]}
              </button>
            ))}
          </div>

          {filteredClothes.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">
              No {categoryLabels[category]} available yet. Ask the admin to add some.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {filteredClothes.map((g) => (
                <button
                  key={g.id}
                  onClick={() => generate(g)}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white text-left hover:border-rose-400 hover:shadow-sm"
                >
                  <div className="relative aspect-[3/4] bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.imageUrl}
                      alt={g.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-stone-500">Try on →</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'generating' && (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-700" />
          <p className="text-lg font-semibold">Generating your try-on…</p>
          <p className="max-w-md text-sm text-stone-500">
            This usually takes 10–60 seconds. First requests of the day may take
            longer if the model is waking up.
          </p>
        </div>
      )}

      {step === 'result' && resultUrl && (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Your try-on result" className="w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-stone-500">Outfit</p>
              <p className="mt-1 font-semibold">{selectedGarment?.name}</p>
              <p className="text-sm text-stone-500">
                {selectedGarment ? categoryLabels[selectedGarment.category] : ''}
              </p>
            </div>
            <a
              href={resultUrl}
              download
              className="block rounded-full bg-rose-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-rose-800"
            >
              Download image
            </a>
            <button
              type="button"
              onClick={() => setStep('pick')}
              className="block w-full rounded-full border border-stone-300 px-5 py-3 text-center text-sm font-semibold text-stone-700 hover:border-stone-400"
            >
              Try another outfit
            </button>
            <button
              type="button"
              onClick={startOver}
              className="block w-full text-center text-sm text-stone-500 hover:text-stone-900"
            >
              Start over with a new photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step | 'generating'; label: string }[] = [
    { id: 'upload', label: 'Photo' },
    { id: 'pick', label: 'Outfit' },
    { id: 'result', label: 'Result' },
  ];
  const activeIndex =
    step === 'upload' ? 0 : step === 'pick' || step === 'generating' ? 1 : 2;
  return (
    <ol className="flex items-center gap-3 text-sm font-medium">
      {steps.map((s, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                active
                  ? 'bg-rose-700 text-white'
                  : done
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-stone-200 text-stone-500'
              }`}
            >
              {i + 1}
            </span>
            <span className={active ? 'text-stone-900' : 'text-stone-500'}>{s.label}</span>
            {i < steps.length - 1 && <span className="h-px w-8 bg-stone-300" />}
          </li>
        );
      })}
    </ol>
  );
}
