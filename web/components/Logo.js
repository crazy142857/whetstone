// Whetstone mark: a stone at an angle with a spark coming off its edge.
export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="14" width="22" height="9" rx="3" transform="rotate(-18 15 18.5)" fill="var(--stone)" />
      <rect x="4" y="14" width="22" height="3" rx="1.5" transform="rotate(-18 15 18.5)" fill="var(--stone-edge)" />
      <path d="M24 4 L25.4 8.2 L29.5 9 L25.4 10 L24 14 L22.6 10 L18.5 9 L22.6 8.2 Z" fill="var(--accent)" />
    </svg>
  );
}
