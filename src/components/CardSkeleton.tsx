/**
 * CardSkeleton — loading placeholder using design system tokens.
 * No shimmer animation (design system rule). Simple pulse only.
 */

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
    <div className="animate-pulse overflow-hidden rounded-(--r-3) border border-border bg-bg">
      <div className="h-48 bg-bg-2" />
      <div className="space-y-3 p-4.5">
        <div className="h-4 w-3/4 rounded-(--r-1) bg-bg-3" />
        <div className="h-3.5 w-1/2 rounded-(--r-1) bg-bg-3" />
        <div className="h-3.5 w-2/3 rounded-(--r-1) bg-bg-3" />
      </div>
    </div>
  );
}

function AvatarCardSkeleton() {
  return (
    <div className="animate-pulse rounded-(--r-3) border border-border bg-bg p-4.5">
      <div className="mb-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-bg-3" />
        <div className="flex-1">
          <div className="mb-2 h-4 w-3/4 rounded-(--r-1) bg-bg-3" />
          <div className="h-3.5 w-1/2 rounded-(--r-1) bg-bg-3" />
        </div>
      </div>
      <div className="mb-2 h-3.5 w-full rounded-(--r-1) bg-bg-3" />
      <div className="h-3.5 w-2/3 rounded-(--r-1) bg-bg-3" />
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
