"use client";

// Gold flute brand mark.
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
