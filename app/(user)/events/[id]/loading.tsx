export default function EventDetailLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Banner skeleton */}
        <div className="h-[420px] animate-pulse overflow-hidden rounded-[2rem] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />

        {/* Two-column body */}
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left column — text details */}
          <div className="space-y-6">
            {/* Title lines */}
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-9 w-4/5 animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-9 w-3/5 animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-32 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-8 w-28 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
            </div>

            {/* Description paragraph lines */}
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-4 w-4/6 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
            </div>

            {/* Organizer row */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              </div>
            </div>
          </div>

          {/* Right column — action card */}
          <div>
            <div className="animate-pulse overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]">
              <div className="space-y-5 p-6">
                {/* Capacity bar */}
                <div className="space-y-2">
                  <div className="h-4 w-1/2 rounded-full bg-[rgba(255,255,255,0.52)] dark:bg-[rgba(15,23,42,0.44)]" />
                  <div className="h-2.5 w-full rounded-full bg-[rgba(255,255,255,0.52)] dark:bg-[rgba(15,23,42,0.44)]" />
                </div>

                {/* Detail rows */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[rgba(255,255,255,0.52)] dark:bg-[rgba(15,23,42,0.44)]" />
                    <div className="h-4 w-40 rounded-full bg-[rgba(255,255,255,0.52)] dark:bg-[rgba(15,23,42,0.44)]" />
                  </div>
                ))}

                {/* CTA button */}
                <div className="h-12 w-full rounded-full bg-[rgba(255,255,255,0.52)] dark:bg-[rgba(15,23,42,0.44)]" />
                <div className="h-12 w-full rounded-full bg-[rgba(255,255,255,0.52)] dark:bg-[rgba(15,23,42,0.44)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
