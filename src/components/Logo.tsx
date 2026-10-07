export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="لوگوی نقشیران"
      role="img"
    >
      <defs>
        <linearGradient id="nqr-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb020" />
          <stop offset="1" stopColor="#ff6a00" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0d1b31" />
      <rect width="64" height="64" rx="15" stroke="rgba(255,176,32,0.28)" strokeWidth="1.5" />
      <path
        d="M32 8C21 8 12.5 17 12.5 28c0 11.5 9.5 17.5 19.5 28C42 45.5 51.5 39.5 51.5 28 51.5 17 43 8 32 8Z"
        fill="none"
        stroke="url(#nqr-g)"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <line x1="32" y1="13.5" x2="32" y2="21" stroke="url(#nqr-g)" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="17" y1="28" x2="24.5" y2="28" stroke="url(#nqr-g)" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="39.5" y1="28" x2="47" y2="28" stroke="url(#nqr-g)" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="32" y1="35" x2="32" y2="42.5" stroke="url(#nqr-g)" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="32" cy="28" r="5.4" fill="none" stroke="url(#nqr-g)" strokeWidth="3.2" />
      <path d="M41 14.5a15 15 0 0 1 7 9.5" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
