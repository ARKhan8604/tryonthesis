'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-400"
    >
      Sign out
    </button>
  );
}
