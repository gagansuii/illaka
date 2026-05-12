export default function MyEventsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 rounded-xl animate-pulse bg-[rgba(128,128,128,0.2)]" />
        <div className="h-9 w-28 rounded-xl animate-pulse bg-[rgba(128,128,128,0.15)]" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 flex gap-4">
          <div className="w-20 h-20 rounded-xl flex-shrink-0 animate-pulse bg-[rgba(128,128,128,0.2)]" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 rounded-lg animate-pulse bg-[rgba(128,128,128,0.18)]" />
            <div className="h-4 w-1/2 rounded-lg animate-pulse bg-[rgba(128,128,128,0.12)]" />
            <div className="flex gap-3">
              <div className="h-4 w-20 rounded-full animate-pulse bg-[rgba(128,128,128,0.12)]" />
              <div className="h-4 w-24 rounded-full animate-pulse bg-[rgba(128,128,128,0.10)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
