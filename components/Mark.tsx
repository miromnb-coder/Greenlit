export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 5.5c-5.8 0-10.5 4.7-10.5 10.5S10.2 26.5 16 26.5"
        stroke="#D4FF00"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M16 26.5c5.8 0 10.5-4.7 10.5-10.5S21.8 5.5 16 5.5"
        stroke="#D4FF00"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="16" cy="16" r="3.1" fill="#D4FF00" />
    </svg>
  );
}
