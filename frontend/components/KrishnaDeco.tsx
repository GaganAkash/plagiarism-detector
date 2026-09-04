"use client";

// Decorative Krishna imagery: peacock feather + "Om" rendered as faint SVG
// marks. Pure CSS/SVG, no image files. Used as a subtle backdrop motif.
export function PeacockFeather({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 300" aria-hidden>
      <g transform="rotate(180 60 150)">
        <path
          d="M60 290 C40 200 20 120 38 55 C52 30 68 30 82 55 C100 120 80 200 60 290 Z"
          fill="none" stroke="url(#peacockGrad)" strokeWidth="6"
        />
        <circle cx="42" cy="70" r="10" fill="rgba(61,218,215,0.5)" />
        <circle cx="78" cy="70" r="10" fill="rgba(255,213,74,0.5)" />
        <circle cx="60" cy="48" r="7" fill="rgba(109,198,255,0.6)" />
        <defs>
          <linearGradient id="peacockGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4a7bd6" />
            <stop offset="0.5" stopColor="#3ddad7" />
            <stop offset="1" stopColor="#6dc6ff" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
}

export function Flute({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" aria-hidden>
      <line x1="20" y1="32" x2="102" y2="20" stroke="#ffd54a" strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="30.5" r="2.4" fill="none" stroke="#ffd98a" strokeWidth="1.5" />
      <circle cx="46" cy="29" r="2.4" fill="none" stroke="#ffd98a" strokeWidth="1.5" />
      <circle cx="60" cy="27.6" r="2.4" fill="none" stroke="#ffd98a" strokeWidth="1.5" />
    </svg>
  );
}

export function Om({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <text x="50" y="76" textAnchor="middle" fontSize="80" fontWeight="700"
        fill="none" stroke="rgba(255,213,74,0.12)" strokeWidth="1.5">ॐ</text>
    </svg>
  );
}
