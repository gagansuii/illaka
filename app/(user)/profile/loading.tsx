export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full animate-pulse bg-[rgba(128,128,128,0.2)]" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded-lg animate-pulse bg-[rgba(128,128,128,0.2)]" />
            <div className="h-4 w-56 rounded-lg animate-pulse bg-[rgba(128,128,128,0.15)]" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl animate-pulse bg-[rgba(128,128,128,0.12)]" />
        ))}
      </div>
    </div>
  );
}
