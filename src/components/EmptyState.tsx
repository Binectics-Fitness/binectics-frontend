export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="text-sm text-foreground-tertiary text-center py-4">
      {message}
    </p>
  );
}
