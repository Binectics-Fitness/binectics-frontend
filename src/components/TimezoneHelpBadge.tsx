"use client";

type TimezoneHelpBadgeProps = {
  message: string;
  label?: string;
  className?: string;
};

export default function TimezoneHelpBadge({
  message,
  label = "Timezone help",
  className = "text-foreground-secondary",
}: TimezoneHelpBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-xs font-bold ${className}`}
      title={message}
      aria-label={label}
    >
      ?
    </span>
  );
}
