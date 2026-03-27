export interface EmptyStateProps {
  message?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ message, title, description, actionLabel, actionHref }: EmptyStateProps) {
  if (title || description) {
    return (
      <div className="text-center py-8">
        {title && <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>}
        {description && <p className="text-sm text-neutral-500 mb-4">{description}</p>}
        {actionLabel && actionHref && (
          <a
            href={actionHref}
            className="inline-flex px-4 py-2 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors"
          >
            {actionLabel}
          </a>
        )}
      </div>
    );
  }
  return (
    <p className="text-sm text-foreground-tertiary text-center py-4">
      {message}
    </p>
  );
}
