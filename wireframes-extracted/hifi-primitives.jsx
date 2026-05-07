// Hi-fi shared primitives

const HFPhone = ({ children, bg = 'var(--paper)' }) => (
  <div className="hf-phone" style={{ background: bg }}>
    <div className="notch" />
    <div className="statusbar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10 }}>
        <span>●●●●</span>
        <span>◐</span>
        <span style={{ border: '1.3px solid var(--ink)', width: 22, height: 11, borderRadius: 2, position: 'relative', display: 'inline-block' }}>
          <span style={{ position: 'absolute', inset: 1, right: 6, background: 'var(--ink)' }}></span>
        </span>
      </span>
    </div>
    {children}
  </div>
);

const HFTopbar = ({ right, center }) => (
  <div className="hf-topbar">
    <div className="logo">
      <div className="mark">i</div>
      <span className="wordmark">ilaaka</span>
    </div>
    {center}
    {right || (
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>⌕</div>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>☷</div>
      </div>
    )}
  </div>
);

const HFBottomNav = ({ active = 'home' }) => (
  <div className="hf-bottomnav">
    <div className={`item ${active === 'home' ? 'active' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/></svg>
      <span className="lbl">home</span>
    </div>
    <div className={`item ${active === 'map' ? 'active' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v16M15 6v16"/></svg>
      <span className="lbl">map</span>
    </div>
    <div className="host-btn">＋</div>
    <div className={`item ${active === 'hood' ? 'active' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      <span className="lbl">hood</span>
    </div>
    <div className={`item ${active === 'me' ? 'active' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
      <span className="lbl">you</span>
    </div>
  </div>
);

// Sketchy ornate separator
const HFSep = ({ label }) => (
  <div className="row gap-10" style={{ alignItems: 'center', margin: '16px 0 12px' }}>
    <div className="solidline" style={{ width: 20 }} />
    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="var(--terra)"/></svg>
    <span className="tab" style={{ letterSpacing: '0.24em' }}>{label}</span>
    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="var(--terra)"/></svg>
    <div className="dotline" style={{ flex: 1 }} />
  </div>
);

// Hero image placeholder w/ caption
const HFImage = ({ kind = 'hero', height = 160, label, style, children }) => (
  <div className={`img-${kind}`} style={{ height, ...style }}>
    {children || (label && <span>{label}</span>)}
  </div>
);

const HFAvatar = ({ letter = 'A', size = 40, bg = 'var(--terra)' }) => (
  <div className="circle" style={{
    width: size, height: size,
    background: bg,
    fontSize: size * 0.4,
    borderWidth: 1.5,
    flexShrink: 0,
  }}>{letter}</div>
);

// Flyer card — core primitive
const HFFlyer = ({
  title, subtitle, meta, host, hostLetter, stamp, stampKind = 'terra',
  imgKind = 'terra', imgLabel = '', tilt = '', tapes = 1, width, height = 'auto',
  price, pin,
}) => (
  <div className={`card card-sh ${tilt}`} style={{ width, padding: 14, boxSizing: 'border-box', position: 'relative' }}>
    {tapes >= 1 && <span className="tape" style={{ top: -9, left: 14, transform: 'rotate(-5deg)' }} />}
    {tapes >= 2 && <span className="tape tape-sage" style={{ top: -9, right: 14, transform: 'rotate(6deg)' }} />}

    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      {stamp && <span className={`stamp stamp-${stampKind}`}>{stamp}</span>}
      {pin && <span className="tab">{pin}</span>}
    </div>

    <HFImage kind={imgKind} height={110} label={imgLabel} style={{ marginTop: 10 }} />

    <div className="serif" style={{ fontSize: 26, lineHeight: 1, marginTop: 10, color: 'var(--ink)' }}>
      {title}
    </div>
    {subtitle && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subtitle}</div>}

    <div className="row gap-6" style={{ marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {meta && <span className="tab">{meta}</span>}
      {price && <span className="pill pill-ghost" style={{ padding: '2px 8px', fontSize: 9 }}>{price}</span>}
    </div>

    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
      <div className="row gap-6" style={{ alignItems: 'center' }}>
        <HFAvatar letter={hostLetter} size={22} bg="var(--mustard)" />
        <span className="mono" style={{ fontSize: 10 }}>by {host}</span>
      </div>
      <span className="pill pill-fill" style={{ fontSize: 9, padding: '4px 9px' }}>RSVP →</span>
    </div>
  </div>
);

// Small flyer (for carousels)
const HFFlyerSm = ({ title, meta, imgKind = 'terra', tilt = '', stamp, stampKind = 'terra', width = 130 }) => (
  <div className={`card card-sh-sm ${tilt}`} style={{ width, padding: 8, flexShrink: 0, boxSizing: 'border-box' }}>
    {stamp && <span className={`stamp stamp-${stampKind}`} style={{ fontSize: 7, padding: '2px 6px', marginBottom: 6, display: 'inline-flex' }}>{stamp}</span>}
    <HFImage kind={imgKind} height={72} />
    <div className="serif" style={{ fontSize: 15, lineHeight: 1.1, marginTop: 6, color: 'var(--ink)' }}>{title}</div>
    <div className="tab" style={{ marginTop: 3, fontSize: 8 }}>{meta}</div>
  </div>
);

// Map preset (hand-drawn looking)
const HFMapBg = ({ height, children }) => (
  <div className="hf-map" style={{ height, border: '1.5px solid var(--ink)' }}>
    {/* regions */}
    <div className="park" style={{ left: '8%', top: '12%', width: 120, height: 90 }} />
    <div className="park" style={{ right: '10%', bottom: '15%', width: 100, height: 72 }} />
    <div className="water" style={{ right: '5%', top: '8%', width: 70, height: 60 }} />

    {/* roads */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path d="M0,60 Q80,70 150,100 T320,180" stroke="rgba(35,28,21,0.15)" strokeWidth="6" fill="none" />
        <path d="M30,0 Q40,120 80,200 T160,400" stroke="rgba(35,28,21,0.12)" strokeWidth="5" fill="none" />
      </svg>
    </div>

    {children}
  </div>
);

// Badge
const HFBadge = ({ icon, label, earned = true, color = 'var(--mustard)' }) => (
  <div className="col" style={{ alignItems: 'center', gap: 5, opacity: earned ? 1 : 0.35, width: 66 }}>
    <div style={{
      width: 52, height: 52,
      background: earned ? color : 'var(--paper-2)',
      border: '1.5px solid var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
      position: 'relative',
    }}>
      <span style={{ fontSize: 22, color: earned ? 'var(--cream)' : 'var(--ink-faint)' }}>{icon}</span>
    </div>
    <span className="tab" style={{ fontSize: 8, textAlign: 'center', letterSpacing: '0.1em' }}>{label}</span>
  </div>
);

Object.assign(window, {
  HFPhone, HFTopbar, HFBottomNav, HFSep, HFImage, HFAvatar, HFFlyer, HFFlyerSm, HFMapBg, HFBadge,
});
