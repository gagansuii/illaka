export default function DiscoverLoading() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="section-shell overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Header text lines */}
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-5 w-full max-w-lg animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
            </div>

            {/* Search bar skeleton */}
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="h-14 animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)] sm:w-36" />
            </div>

            {/* Map + side card */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Map area */}
              <div className="h-[420px] animate-pulse overflow-hidden rounded-[2.2rem] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)] sm:h-[500px]" />

              {/* Side cards */}
              <div className="space-y-4">
                <div className="h-[260px] animate-pulse rounded-[2rem] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
                <div className="h-[260px] animate-pulse rounded-[2rem] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="h-72 animate-pulse rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
          <div className="h-52 animate-pulse rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
        </aside>
      </div>

      {/* Event cards row */}
      <section className="space-y-4">
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
          <div className="h-9 w-72 animate-pulse rounded-2xl bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-[260px] animate-pulse rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
          <div className="h-[260px] animate-pulse rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.34)] dark:bg-[rgba(15,23,42,0.28)]" />
        </div>
      </section>
    </div>
  );
}
