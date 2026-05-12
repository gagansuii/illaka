export default function HomeLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero area skeleton */}
      <div style={{ height: 56, width: '40%', borderRadius: 14, background: 'rgba(128,128,128,0.15)', marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 36, width: '25%', borderRadius: 10, background: 'rgba(128,128,128,0.12)', marginBottom: 40, animation: 'pulse 1.5s ease-in-out infinite' }} />

      {/* Event grid skeleton — 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 24, overflow: 'hidden', background: 'rgba(128,128,128,0.1)', animation: 'pulse 1.5s ease-in-out infinite' }}>
            <div style={{ height: 200, background: 'rgba(128,128,128,0.15)' }} />
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 20, width: '70%', borderRadius: 8, background: 'rgba(128,128,128,0.18)' }} />
              <div style={{ height: 14, width: '90%', borderRadius: 6, background: 'rgba(128,128,128,0.12)' }} />
              <div style={{ height: 14, width: '50%', borderRadius: 6, background: 'rgba(128,128,128,0.10)' }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}
