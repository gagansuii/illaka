// Reusable wireframe primitives for ilaaka

const Phone = ({ children, bg = 'var(--paper)' }) => (
  <div className="wf-phone" style={{ background: bg }}>
    <div className="notch" />
    <div className="statusbar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>·il</span><span>◐</span><span>▮</span>
      </span>
    </div>
    {children}
  </div>
);

const TopNav = ({ right = 'Host', title = 'ilaaka' }) => (
  <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 10px' }}>
    <div className="row gap-6" style={{ alignItems: 'center' }}>
      <div className="circle" style={{ width: 22, height: 22, background: 'var(--terra)', borderColor: 'var(--ink)' }}>
        <span style={{ fontSize: 9, color: 'var(--paper)' }}>✦</span>
      </div>
      <span className="serif" style={{ fontSize: 18 }}>{title}</span>
    </div>
    <div className="row gap-6">
      <div className="pill">◎ Map</div>
      <div className="pill pill-fill">+ {right}</div>
    </div>
  </div>
);

const BottomTab = ({ active = 'home' }) => (
  <div className="row" style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTop: '1.5px solid var(--ink)',
    background: 'var(--paper-warm)',
    justifyContent: 'space-around',
    padding: '10px 0 14px',
  }}>
    {[
      ['home', '⌂', 'home'],
      ['map', '◎', 'map'],
      ['host', '＋', 'host'],
      ['hood', '☷', 'hood'],
      ['me', '◉', 'me'],
    ].map(([k, ic, lbl]) => (
      <div key={k} className="col" style={{ alignItems: 'center', gap: 2, color: active === k ? 'var(--terra)' : 'var(--ink-soft)' }}>
        <span style={{ fontSize: 16 }}>{ic}</span>
        <span style={{ fontSize: 8, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lbl}</span>
      </div>
    ))}
  </div>
);

// Flyer-style event card
const EventFlyer = ({ title, meta, host, pill = 'TONIGHT', tint = 'terra', tilt = 'tilt-l' }) => (
  <div className={`box ${tilt}`} style={{
    background: 'var(--paper-warm)',
    padding: 12,
    position: 'relative',
    boxShadow: '2px 2px 0 var(--ink)',
  }}>
    <div className="tape" style={{ top: -8, left: 16, transform: 'rotate(-4deg)' }} />
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span className={`stamp stamp-${tint === 'terra' ? 'terra' : 'sage'}`}>{pill}</span>
      <span className="label">#{Math.floor(Math.random() * 90 + 10)}</span>
    </div>
    <div className={`img-ph img-${tint}`} style={{ height: 64, marginTop: 8 }}>
      {title.toUpperCase()}
    </div>
    <div className="serif" style={{ fontSize: 20, marginTop: 8, lineHeight: 1.1 }}>{title}</div>
    <div className="label" style={{ marginTop: 4 }}>{meta}</div>
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
      <div className="row gap-4" style={{ alignItems: 'center' }}>
        <div className="circle" style={{ width: 16, height: 16, fontSize: 8, background: 'var(--mustard)' }}>{host[0]}</div>
        <span className="mono" style={{ fontSize: 10 }}>by {host}</span>
      </div>
      <span className="pill pill-fill">RSVP →</span>
    </div>
  </div>
);

// Tiny annotation
const Note = ({ children, style }) => (
  <div className="hand" style={{ color: 'var(--terra)', fontSize: 14, lineHeight: 1.2, ...style }}>
    {children}
  </div>
);

// Sketchy map background
const SketchMap = ({ height = 160, pins = 3 }) => (
  <div className="box" style={{
    height,
    background: 'var(--paper-warm)',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `
      linear-gradient(90deg, transparent 0, transparent 20%, rgba(107,122,90,0.2) 20%, rgba(107,122,90,0.2) 22%, transparent 22%),
      linear-gradient(0deg, transparent 0, transparent 40%, rgba(90,122,138,0.2) 40%, rgba(90,122,138,0.2) 42%, transparent 42%),
      linear-gradient(45deg, transparent 0, transparent 60%, rgba(42,36,30,0.1) 60%, rgba(42,36,30,0.1) 61%, transparent 61%),
      repeating-linear-gradient(0deg, transparent 0, transparent 18px, rgba(42,36,30,0.04) 18px, rgba(42,36,30,0.04) 19px),
      repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(42,36,30,0.04) 18px, rgba(42,36,30,0.04) 19px)
    `,
  }}>
    {Array.from({ length: pins }).map((_, i) => (
      <div key={i} style={{
        position: 'absolute',
        left: `${20 + i * 22}%`,
        top: `${30 + (i % 2) * 25}%`,
      }}>
        <div className="pin" />
      </div>
    ))}
    <div className="hand" style={{
      position: 'absolute', bottom: 6, right: 8,
      color: 'var(--ink-soft)', fontSize: 12,
    }}>~ yr hood</div>
  </div>
);

// Small divider with centered label
const Divider = ({ label }) => (
  <div className="row" style={{ alignItems: 'center', gap: 8, margin: '12px 0' }}>
    <div className="dotline" style={{ flex: 1 }} />
    <span className="label">{label}</span>
    <div className="dotline" style={{ flex: 1 }} />
  </div>
);

// Stamped badge (profile)
const Badge = ({ icon, label, earned = true }) => (
  <div className="col" style={{ alignItems: 'center', gap: 4, opacity: earned ? 1 : 0.4 }}>
    <div className="circle" style={{
      width: 44, height: 44,
      background: earned ? 'var(--mustard)' : 'var(--paper-warm)',
      borderWidth: 1.5,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <span className="label-ink" style={{ fontSize: 8, textAlign: 'center', maxWidth: 60 }}>{label}</span>
  </div>
);

// Notebook paper lines
const Lines = ({ count = 5, width = '100%' }) => (
  <div className="col gap-6" style={{ width }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        height: 1.5,
        background: 'var(--ink-soft)',
        opacity: 0.4,
        width: i === count - 1 ? '60%' : '100%',
      }} />
    ))}
  </div>
);

Object.assign(window, {
  Phone, TopNav, BottomTab, EventFlyer, Note, SketchMap, Divider, Badge, Lines,
});
