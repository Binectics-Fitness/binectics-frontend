interface CardSkeletonProps {
  count?: number;
  columns?: "1" | "2" | "3";
  variant?: "image" | "avatar";
}

const gridMap = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
} as const;

function ImageCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="h-48 bg-neutral-200" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-1/2 rounded bg-neutral-200" />
        <div className="h-4 w-2/3 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function AvatarCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-neutral-200" />
        <div className="flex-1">
          <div className="mb-2 h-5 w-3/4 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
        </div>
      </div>
      <div className="mb-2 h-4 w-full rounded bg-neutral-200" />
      <div className="h-4 w-2/3 rounded bg-neutral-200" />
    </div>
  );
}

export function CardSkeleton({
  count = 6,
  columns = "3",
  variant = "image",
}: CardSkeletonProps) {
  const Card = variant === "avatar" ? AvatarCardSkeleton : ImageCardSkeleton;

  return (
    <div className={`grid ${gridMap[columns]} gap-6`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

export default CardSkeleton;
