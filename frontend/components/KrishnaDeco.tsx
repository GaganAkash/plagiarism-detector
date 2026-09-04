"use client";

// Decorative SVG marks: a bamboo bansuri (flute) brand mark with a tuck-in
// peacock feather, plus an animated circular peacock-feather mandala backdrop.

// A single realistic peacock ocellus feather pointing up.
function Feather() {
  return (
    <g>
      {/* barbs (leaf shape around rachis) */}
      <path d="M60 58 C52 42 53 24 60 6 C67 24 68 42 60 58 Z"
        fill="rgba(44,160,110,0.6)" stroke="rgba(150,200,110,0.45)" strokeWidth="0.7" />
      {/* rachis (stem) */}
      <line x1="60" y1="56" x2="60" y2="12" stroke="rgba(200,230,150,0.85)" strokeWidth="1.3" strokeLinecap="round" />
      {/* ocellus eye: gold ring -> indigo blue -> teal -> dark pupil (peacock feather) */}
      <ellipse cx="60" cy="18" rx="5.5" ry="9" fill="#d99a2b" />
      <ellipse cx="60" cy="18" rx="4" ry="7" fill="#2a487e" />
      <ellipse cx="60" cy="18" rx="2.7" ry="4.6" fill="#1f7a5c" />
      <circle cx="60" cy="18" r="1.2" fill="#081420" />
    </g>
  );
}

// Bamboo bansuri (flute) with a peacock feather tucked behind it, slanted.
export function Flute({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 90" aria-hidden>
      {/* peacock feather tucked behind the flute (upper area) */}
      <g transform="rotate(-22 118 42)">
        <path d="M118 40 C112 28 113 12 118 0 C123 12 124 28 118 40 Z"
          fill="rgba(44,160,110,0.8)" stroke="rgba(150,200,110,0.55)" strokeWidth="0.7" />
        <line x1="118" y1="38" x2="118" y2="6" stroke="rgba(200,230,150,0.9)" strokeWidth="1.3" />
        <ellipse cx="118" cy="9" rx="5" ry="8" fill="#d99a2b" />
        <ellipse cx="118" cy="9" rx="3.6" ry="6" fill="#2a487e" />
        <ellipse cx="118" cy="9" rx="2.4" ry="4" fill="#1f7a5c" />
        <circle cx="118" cy="9" r="1.1" fill="#081420" />
      </g>

      {/* bamboo flute, slanted slightly */}
      <g transform="rotate(-18 75 45)">
        <rect x="8" y="37" width="134" height="16" rx="8" fill="url(#fluteBody)" />
        <line x1="48" y1="36.5" x2="48" y2="54" stroke="#4a2f14" strokeWidth="1.2" opacity="0.7" />
        <line x1="88" y1="36" x2="88" y2="54.5" stroke="#4a2f14" strokeWidth="1.2" opacity="0.7" />
        {/* mouthpiece notch */}
        <path d="M24 53 L16 53 L16 47" fill="none" stroke="#4a2f14" strokeWidth="2.2" strokeLinecap="round" />
        {/* finger holes */}
        <ellipse cx="38" cy="45" rx="1.7" ry="1.7" fill="#4a2f14" />
        <ellipse cx="62" cy="44" rx="1.7" ry="1.7" fill="#4a2f14" />
        <ellipse cx="84" cy="43" rx="1.7" ry="1.7" fill="#4a2f14" />
        <ellipse cx="103" cy="42" rx="1.7" ry="1.7" fill="#4a2f14" />
        {/* tassel */}
        <path d="M130 45 q2 11 0 15 M135 45 q-2 11 0 15 M132.5 45 q0 12 0 16" stroke="#86c880" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>

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

// Feathers arranged in a circle (rotates via CSS). The visible bottom half
// reads as a semi-circular arc when the wheel is parked below the viewport.
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
