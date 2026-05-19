import Link from 'next/link';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories';

const HERO_DESCRIPTIONS: Record<(typeof CATEGORIES)[number], string> = {
  saree: 'Drape an embroidered saree without the studio appointment.',
  lehnga_choli: 'See how the choli and flared skirt sit on you.',
  anarkali: 'Try a flared anarkali frock against your own figure.',
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-700">
            Virtual fitting room
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Try on desi clothes <br />without changing rooms.
          </h1>
          <p className="mt-5 max-w-md text-lg text-stone-600">
            Upload a full-body photo, pick a saree, lehnga choli or anarkali frock,
            and let our AI generate a fitted preview in seconds.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/try-on"
              className="rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-800"
            >
              Start trying on
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:border-stone-400"
            >
              How it works
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 p-1">
          <div className="rounded-[1.4rem] bg-white p-8">
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((c) => (
                <div
                  key={c}
                  className="aspect-[3/4] rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-end p-3 text-xs font-medium text-stone-700"
                >
                  {CATEGORY_LABEL[c]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { n: 1, t: 'Upload your photo', d: 'Full-body, plain background, arms slightly out. We’ll show a pose guide.' },
            { n: 2, t: 'Pick an outfit', d: 'Browse our saree, lehnga and anarkali catalogue.' },
            { n: 3, t: 'Get your try-on', d: 'AI generates a fitted preview you can save or share.' },
          ].map((s) => (
            <li key={s.n} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-700 text-sm font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">Catalogue</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/try-on?category=${c}`}
              className="group rounded-2xl border border-stone-200 bg-white p-6 hover:border-rose-400 hover:shadow-sm"
            >
              <h3 className="text-lg font-semibold">{CATEGORY_LABEL[c]}</h3>
              <p className="mt-2 text-sm text-stone-600">{HERO_DESCRIPTIONS[c]}</p>
              <p className="mt-6 text-sm font-medium text-rose-700 group-hover:underline">
                Browse →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
