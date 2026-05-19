'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!confirm('Delete this garment?')) return;
    setPending(true);
    const res = await fetch(`/api/admin/clothes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) router.refresh();
    else alert('Delete failed');
    setPending(false);
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="text-xs font-medium text-rose-700 hover:underline disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
