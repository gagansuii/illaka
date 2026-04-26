// Hi-fi Event detail (flyer taped)

const HiEvent = () => (
  <HFPhone bg="var(--paper-2)">
    <div className="hf-topbar">
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>←</div>
        <span className="tab">BACK TO WALL</span>
      </div>
      <div className="row gap-8">
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>♡</div>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>↗</div>
      </div>
    </div>

    <div style={{ padding: '8px 16px 140px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      {/* Flyer — large, taped to the wall */}
      <div className="card card-sh" style={{ padding: 18, position: 'relative', marginTop: 8 }}>
        <span className="tape" style={{ top: -11, left: 20, transform: 'rotate(-6deg)', width: 72 }} />
        <span className="tape tape-sage" style={{ top: -11, right: 20, transform: 'rotate(7deg)', width: 72 }} />

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="tab">EV · #0247 · HERITAGE SERIES IV</span>
          <span className="stamp stamp-terra">TONIGHT</span>
        </div>

        <h1 className="display" style={{ fontSize: 54, marginTop: 10 }}>
          Kiln<br /><span className="serif c-terra" style={{ fontSize: 58 }}>& chai.</span>
        </h1>
        <div className="mono" style={{ fontSize: 11, marginTop: 4, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          pottery · sunset · heritage lane
        </div>

        <HFImage kind="hero" height={180} style={{ marginTop: 14 }}>
          <span>HERO IMAGE · KILN DOORWAY AT DUSK</span>
        </HFImage>

        <div className="stamp-mark" style={{ position: 'absolute', top: 140, right: 20 }}>
          PUBLIC<br />WALL
        </div>

        {/* at-a-glance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginTop: 14, border: '1.5px solid var(--ink)' }}>
          {[
            ['WHEN', 'Oct 24', '5:30 pm'],
            ['WHERE', 'Old Kiln', '460 m w'],
            ['PRICE', 'Pay-what', 'you-can'],
          ].map(([k, a, b], i) => (
            <div key={k} className="col" style={{
              padding: 10,
              borderRight: i < 2 ? '1.5px solid var(--ink)' : 'none',
              background: i === 0 ? 'rgba(200,85,54,0.08)' : i === 1 ? 'rgba(108,125,87,0.08)' : 'rgba(212,167,58,0.1)',
            }}>
              <span className="tab" style={{ fontSize: 8 }}>{k}</span>
              <span className="serif" style={{ fontSize: 18, marginTop: 2, lineHeight: 1 }}>{a}</span>
              <span className="mono" style={{ fontSize: 9, marginTop: 2, color: 'var(--ink-soft)' }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      <HFSep label="the story" />
      <p className="serif" style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--ink-2)' }}>
        Step back to when creation was a conversation between hand and soil.
        Our pottery sundown isn't just about crafting a vessel — it's the heritage of patience, the narrative of the flame.
      </p>
      <p className="mono" style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 10 }}>
        Come dusty, leave warm. We'll have chai going. First 6 get the good stools.
      </p>

      <HFSep label="your host" />
      <div className="card card-sh-sm" style={{ padding: 14 }}>
        <div className="row gap-12" style={{ alignItems: 'center' }}>
          <HFAvatar letter="E" size={54} bg="var(--mustard)" />
          <div className="col" style={{ flex: 1 }}>
            <div className="row gap-4" style={{ alignItems: 'baseline' }}>
              <span className="serif" style={{ fontSize: 20 }}>Elias Thorne</span>
              <span className="tab c-terra">★ 4.9</span>
            </div>
            <span className="tab">MASTER KILNER · 23 EVENTS · 40 YRS</span>
            <div className="row gap-4" style={{ marginTop: 6 }}>
              <span className="stamp stamp-paper" style={{ fontSize: 7, padding: '2px 5px' }}>VERIFIED</span>
              <span className="stamp stamp-paper" style={{ fontSize: 7, padding: '2px 5px' }}>HOST 5×</span>
              <span className="stamp stamp-paper" style={{ fontSize: 7, padding: '2px 5px' }}>LOCAL 40Y</span>
            </div>
          </div>
        </div>
        <p className="hand" style={{ fontSize: 16, marginTop: 10, color: 'var(--ink-soft)', lineHeight: 1.3 }}>
          "40 yrs tending this kiln. come make something that outlives the week."
        </p>
      </div>

      <HFSep label="where" />
      <div className="card" style={{ overflow: 'hidden' }}>
        <HFMapBg height={140}>
          <div className="pin" style={{ left: '50%', top: '55%' }}>
            <div style={{ position: 'relative' }}>
              <div className="pin-dot" style={{ width: 36, height: 36, fontSize: 16 }}>☕</div>
              <div className="pin-tail" />
            </div>
          </div>
        </HFMapBg>
        <div className="row" style={{ padding: '10px 12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="col">
            <span className="serif" style={{ fontSize: 15 }}>The Old Kiln · 42 heritage ln</span>
            <span className="tab">460M W · 6 MIN WALK</span>
          </div>
          <span className="pill pill-ghost" style={{ fontSize: 9, padding: '4px 10px' }}>↗ DIRECTIONS</span>
        </div>
      </div>

      <HFSep label="13 going · 2 on fence" />
      <div className="row" style={{ flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {[['M','var(--terra)'],['A','var(--sage)'],['K','var(--mustard)'],['R','var(--plum)'],['J','var(--sky)'],['P','var(--terra-2)'],['S','var(--sage-2)'],['T','var(--terra)'],['N','var(--plum)'],['Z','var(--mustard)']].map(([l, bg], i) => (
          <HFAvatar key={i} letter={l} size={32} bg={bg} />
        ))}
        <div className="circle" style={{ width: 32, height: 32, background: 'var(--paper-card)', color: 'var(--ink)', fontSize: 11 }}>+3</div>
        <span className="mono" style={{ fontSize: 11, marginLeft: 6, color: 'var(--ink-soft)' }}>incl. 3 regulars</span>
      </div>

      <HFSep label="what to bring" />
      <div className="col gap-8">
        {[
          ['☕', 'a mug — we reuse, not single-use'],
          ['♨', 'clothes you don\'t mind getting muddy'],
          ['◐', 'a story, if you\'ve got one'],
        ].map(([ic, t], i) => (
          <div key={i} className="row gap-10" style={{ alignItems: 'center' }}>
            <div className="icon-box" style={{ width: 32, height: 32 }}>{ic}</div>
            <span className="serif" style={{ fontSize: 15 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>

    {/* sticky CTA */}
    <div style={{
      position: 'absolute', bottom: 64, left: 0, right: 0,
      padding: '12px 16px',
      background: 'var(--paper-card)',
      borderTop: '1.5px solid var(--ink)',
    }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="col">
          <span className="serif" style={{ fontSize: 18, lineHeight: 1 }}>Pay-what-you-can</span>
          <span className="tab">SUGGESTED ₹200 · 6 SPOTS LEFT</span>
        </div>
        <span className="stamp stamp-terra">STARTS IN 2H 14M</span>
      </div>
      <div className="row gap-8">
        <span className="btn btn-ghost btn-sm" style={{ flex: 0.6 }}>♡ SAVE</span>
        <span className="btn btn-terra" style={{ flex: 1.4 }}>RSVP · I'M IN →</span>
      </div>
    </div>
    <HFBottomNav active="home" />
  </HFPhone>
);

Object.assign(window, { HiEvent });
