'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(error ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(next);
      } else {
        const body = await res.json().catch(() => ({}));
        setMessage(body.error ?? 'Sign in failed');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Password</span>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          required
        />
      </label>
      {message && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 disabled:bg-stone-300"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
