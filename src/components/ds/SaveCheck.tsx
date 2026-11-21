/**
 * The check that strokes on inside a primary button once a save has landed
 * (300ms out-expo), then holds. Render it only after success, never on
 * press. Reduced motion: drawn at once. Decorative: the status line or toast
 * says what happened. Mirrors binectics-mobile SaveCheck.
 */
export const SAVE_CHECK_MS = 300;

export function SaveCheck({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="bx-save-check"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid="save-check"
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}
