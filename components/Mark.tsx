export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="#111" aria-hidden>
      <circle cx="18" cy="16" r="8" />
      <circle cx="48" cy="50" r="7.2" />
      <path d="M26 14.5c12.5 0 23 9.2 23 22.2 0 8.2-5.2 14.8-13.6 18.2" />
      <path
        d="M22 22c11 1.5 19 9.4 19 18.8 0 6.4-4 12-11.5 15.2"
        fill="none"
        stroke="#111"
        strokeWidth="7.2"
        strokeLinecap="round"
      />
      <path
        d="M38.5 18.5C28 16 18 22.5 16.5 34.5c-1.2 9.5 5.2 17.8 15 20.6"
        fill="none"
        stroke="#111"
        strokeWidth="7.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Lockup() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="text-[1.15rem] font-semibold tracking-tight">Greenlit</span>
    </span>
  );
}
