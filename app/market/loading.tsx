function SkeletonBar({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-muted ${className}`}
      aria-hidden="true"
    />
  );
}

export default function MarketLoading() {
  return (
    <section className="section-space" aria-busy="true" aria-live="polite">
      <div className="page-wrap space-y-8">
        <div className="max-w-3xl space-y-4">
          <SkeletonBar className="h-4 w-72" />
          <SkeletonBar className="h-10 w-40" />
          <SkeletonBar className="h-4 w-56" />
          <SkeletonBar className="h-6 w-full max-w-xl" />
          <SkeletonBar className="h-4 w-full max-w-2xl" />
        </div>
        <div className="rounded-md border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SkeletonBar className="h-11" />
            <SkeletonBar className="h-11" />
            <SkeletonBar className="h-11" />
            <SkeletonBar className="h-11" />
            <SkeletonBar className="h-11" />
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="space-y-3 p-4">
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
            <SkeletonBar className="h-8" />
          </div>
        </div>
        <p className="sr-only">Loading market pairs</p>
      </div>
    </section>
  );
}
