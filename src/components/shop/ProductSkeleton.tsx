export function ProductSkeleton() {
  return (
    <div className="bg-[var(--charcoal)] rounded-xl border border-[var(--gold)]/10 overflow-hidden flex flex-col justify-between animate-pulse">
      {/* Image box skeleton */}
      <div className="relative aspect-square bg-[var(--ink)]/80" />

      {/* Details skeleton */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-[var(--sand)]/10 rounded" />
          <div className="h-5 w-3/4 bg-[var(--sand)]/15 rounded" />
          <div className="h-3 w-full bg-[var(--sand)]/10 rounded" />
          <div className="h-3 w-2/3 bg-[var(--sand)]/10 rounded" />
        </div>

        <div className="pt-4 border-t border-[var(--sand)]/10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-10 bg-[var(--sand)]/10 rounded" />
            <div className="h-5 w-24 bg-[var(--gold)]/20 rounded" />
          </div>
          <div className="h-8 w-20 bg-[var(--ink)] rounded-lg border border-[var(--sand)]/10" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}
