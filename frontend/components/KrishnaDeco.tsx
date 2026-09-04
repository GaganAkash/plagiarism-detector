"use client";

// Decorative SVG marks: a bamboo bansuri (flute) brand mark and an animated
// circular peacock-feather mandala for the backdrop.

export function Flute({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 50" aria-hidden>
      {/* bamboo tube */}
      <rect x="14" y="17" width="92" height="16" rx="8" fill="url(#fluteBody)" />
      {/* bamboo nodes */}
      <line x1="48" y1="16.5" x2="48" y2="34" stroke="#4a2f14" strokeWidth="1.2" opacity="0.7" />
      <line x1="78" y1="16" x2="78" y2="34.5" stroke="#4a2f14" strokeWidth="1.2" opacity="0.7" />
      {/* mouthpiece notch */}
      <path d="M28 33 L20 33 L20 27" fill="none" stroke="#4a2f14" strokeWidth="2.2" strokeLinecap="round" />
      {/* finger holes */}
      <ellipse cx="40" cy="24" rx="1.7" ry="1.7" fill="#4a2f14" />
      <ellipse cx="55" cy="22.5" rx="1.7" ry="1.7" fill="#4a2f14" />
      <ellipse cx="69" cy="21" rx="1.7" ry="1.7" fill="#4a2f14" />
      <ellipse cx="83" cy="19.5" rx="1.7" ry="1.7" fill="#4a2f14" />
      {/* tassel */}
      <path d="M98 33 q2 9 0 13 M102 33 q-2 9 0 13 M100 33 q0 10 0 14" stroke="#86c880" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="fluteBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ca8a3c" />
          <stop offset="0.5" stopColor="#a06a2a" />
          <stop offset="1" stopColor="#7a4d1e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// A single peacock feather pointing up, with the classic ocellus "eye".
function Feather() {
  return (
    <g>
      {/* barbs (leaf shape around rachis) */}
      <path d="M60 58 C53 42 54 24 60 8 C66 24 67 42 60 58 Z"
        fill="rgba(47,174,115,0.55)" stroke="rgba(86,200,145,0.35)" strokeWidth="0.6" />
      {/* rachis (stem) */}
      <line x1="60" y1="56" x2="60" y2="12" stroke="#86c880" strokeWidth="1.4" strokeLinecap="round" />
      {/* ocellus eye */}
      <ellipse cx="60" cy="17" rx="5" ry="8" fill="#24b38a" />
      <ellipse cx="60" cy="17" rx="3" ry="5" fill="#86c880" />
      <circle cx="60" cy="17" r="1.3" fill="#0b211a" />
    </g>
  );
}

// Feathers arranged in a circle (mandala). Rotated slowly via CSS on the svg.
export function FeatherCircle({ className }: { className?: string }) {
  const n = 8;
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i} transform={`rotate(${(360 / n) * i} 60 60)`}>
          <Feather />
        </g>
      ))}
    </svg>
  );
}
