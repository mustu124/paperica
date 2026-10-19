import { cn } from "@/lib/cn";

/** Loading placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse bg-taupe/40", className)} />;
}

/** Placeholder matching a product tile: 4:5 image, name, price. */
export function ProductTileSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mx-auto h-4 w-3/4" />
      <Skeleton className="mx-auto h-4 w-1/4" />
    </div>
  );
}
