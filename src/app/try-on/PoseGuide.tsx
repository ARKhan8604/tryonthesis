export function PoseGuide() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-stone-700">For the best fit</h3>
      <ul className="mt-4 space-y-3 text-sm text-stone-600">
        <Tip>Stand against a plain wall, well-lit.</Tip>
        <Tip>Full body in frame — head to feet.</Tip>
        <Tip>Face the camera, arms slightly out from your sides.</Tip>
        <Tip>Wear close-fitting clothes (loose layers confuse the AI).</Tip>
        <Tip>No filters or heavy editing on the photo.</Tip>
      </ul>
      <figure className="mt-6">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-stone-100 to-stone-200">
          <svg viewBox="0 0 120 160" className="absolute inset-0 h-full w-full text-stone-400">
            <circle cx="60" cy="28" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="100" stroke="currentColor" strokeWidth="1.5" />
            <line x1="60" y1="52" x2="34" y2="74" stroke="currentColor" strokeWidth="1.5" />
            <line x1="60" y1="52" x2="86" y2="74" stroke="currentColor" strokeWidth="1.5" />
            <line x1="60" y1="100" x2="48" y2="138" stroke="currentColor" strokeWidth="1.5" />
            <line x1="60" y1="100" x2="72" y2="138" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <figcaption className="mt-2 text-xs text-stone-500">Sample pose</figcaption>
      </figure>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-700" />
      <span>{children}</span>
    </li>
  );
}
