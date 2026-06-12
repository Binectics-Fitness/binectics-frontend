"use client";

type TimezoneHelpBadgeProps = {
  message: string;
  label?: string;
  className?: string;
};

export default function TimezoneHelpBadge({
  message,
  label = "Timezone help",
  className = "text-fg-2",
}: TimezoneHelpBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-border-2 text-xs font-bold ${className}`}
      title={message}
      aria-label={label}
    >
      ?
    </span>
  );
}
