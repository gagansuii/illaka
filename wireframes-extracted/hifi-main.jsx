// Hi-fi Home (editorial wall) + Feed (collaged bulletin) + Map + Hood

const HiHome = () => (
  <HFPhone>
    <HFTopbar />
    <div style={{ padding: '0 18px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      {/* Masthead */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
        <span className="tab">VOL. IV · TUE APR 22</span>
        <span className="tab c-terra">◉ LODI · 2KM</span>
      </div>
      <div className="solidline" style={{ margin: '6px 0 12px' }} />

      <h1 className="display" style={{ fontSize: 56 }}>
        more alive<br />
        <span className="serif u-terra" style={{ fontSize: 56, color: 'var(--terra-deep)' }}>than you think.</span>
      </h1>
      <p className="mono" style={{ fontSize: 12, marginTop: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        22 things happening in walking distance. pick one for tonight.
      </p>

      <div className="row gap-8" style={{ marginTop: 14 }}>
        <span className="btn btn-terra btn-sm" style={{ flex: 1 }}>EXPLORE →</span>
        <span className="btn btn-ghost btn-sm">◎ MAP</span>
      </div>

      <HFSep label="starting soon" />

      <div className="col gap-16">
        <HFFlyer
          title="Kiln & chai"
          subtitle="heritage series · vol iv"
          meta="TONIGHT · 6:30 PM · 460M W"
          host="Meera" hostLetter="M"
          stamp="TONIGHT" stampKind="terra"
          imgKind="terra" imgLabel="HERO · KILN DOORWAY"
          tilt="tilt-l"
          tapes={1}
          price="PAY-WHAT-YOU-CAN"
        />
        <HFFlyer
          title="Bookswap @ park"
          subtitle="neighbourhood circle"
          meta="WED · 5 PM · LODI GDNS"
          host="Arjun" hostLetter="A"
          stamp="6 SPOTS LEFT" stampKind="sage"
          imgKind="sage" imgLabel="HERO · PICNIC BLANKET"
          tilt="tilt-r"
          tapes={2}
          price="FREE"
        />
      </div>

      <HFSep label="pinned on the wall" />

      <div className="row gap-12" style={{ overflowX: 'auto', paddingBottom: 10, paddingTop: 6 }}>
        <HFFlyerSm title="Open mic" meta="FRI · 8 PM" imgKind="plum" tilt="tilt-l" stamp="WEEKLY" />
        <HFFlyerSm title="Run club" meta="SAT · 6 AM" imgKind="sage" tilt="tilt-r" stamp="REG." stampKind="sage" />
        <HFFlyerSm title="Film night" meta="SAT · 9 PM" imgKind="ink" tilt="tilt-l" stamp="BYOB" />
        <HFFlyerSm title="Skill swap" meta="SUN · 11" imgKind="mustard" tilt="tilt-r" stamp="POT-LUCK" stampKind="sage" />
      </div>

      <HFSep label="people hosting this week" />
      <div className="row gap-10" style={{ overflowX: 'auto', paddingBottom: 6 }}>
        {[['M','var(--terra)'],['A','var(--sage)'],['E','var(--mustard)'],['R','var(--plum)'],['J','var(--sky)']].map(([l, bg], i) => (
          <div key={i} className="col" style={{ alignItems: 'center', gap: 4, minWidth: 56, flexShrink: 0 }}>
            <HFAvatar letter={l} size={50} bg={bg} />
            <span className="tab" style={{ fontSize: 8 }}>{['Meera','Arjun','Elias','Raghu','Jaya'][i]}</span>
          </div>
        ))}
      </div>
    </div>
    <HFBottomNav active="home" />
  </HFPhone>
);

const HiFeed = () => (
  <HFPhone bg="var(--paper-2)">
    <HFTopbar />
    <div style={{ padding: '0 14px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
        <div className="col">
          <span className="tab">THE NOTICEBOARD</span>
          <h2 className="display" style={{ fontSize: 32 }}>what's <span className="serif c-terra">up</span></h2>
        </div>
        <div className="row gap-4">
          <span className="pill pill-fill" style={{ padding: '5px 10px', fontSize: 9 }}>☷ FEED</span>
          <span className="pill" style={{ padding: '5px 10px', fontSize: 9 }}>◎ MAP</span>
        </div>
      </div>

      {/* search + filters */}
      <div className="card" style={{ padding: '10px 12px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>⌕</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>meetups near me after work…</span>
        <span className="pill pill-ghost" style={{ marginLeft: 'auto', padding: '3px 8px', fontSize: 8 }}>⚙ FILTER</span>
      </div>

      <div className="row gap-5" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        {[
          ['all', true],['today', false],['wknd', false],['arts', false],['food', false],['free', false],['walks', false]
        ].map(([t, active]) => (
          <span key={t} className={`pill ${active ? 'pill-fill' : 'pill-ghost'}`} style={{ padding: '4px 10px', fontSize: 9 }}>{t}</span>
        ))}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span className="tab">22 HAPPENINGS · 2 KM</span>
        <span className="tab c-terra">SORT · soonest ⌄</span>
      </div>

      {/* collaged grid */}
      <div style={{ position: 'relative', marginTop: 14, minHeight: 780 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 145 }}>
          <HFFlyerSm title="Kiln & chai" meta="TONIGHT · 6:30" imgKind="terra" tilt="tilt-ll" stamp="TONITE" stampKind="terra" width={145} />
        </div>
        <div style={{ position: 'absolute', top: 20, right: 0, width: 140 }}>
          <HFFlyerSm title="Bookswap" meta="WED · 5 PM" imgKind="sage" tilt="tilt-rr" stamp="6 SPOTS" stampKind="sage" width={140} />
        </div>
        <div style={{ position: 'absolute', top: 220, left: 4, width: 142 }}>
          <HFFlyerSm title="Open mic" meta="FRI · 8 PM" imgKind="plum" tilt="tilt-r" stamp="3 SPOTS" width={142} />
        </div>
        <div style={{ position: 'absolute', top: 230, right: 8, width: 138 }}>
          <HFFlyerSm title="Sabzi hunt" meta="SUN · 7 AM" imgKind="mustard" tilt="tilt-l" stamp="POT-LUCK" stampKind="sage" width={138} />
        </div>
        <div style={{ position: 'absolute', top: 440, left: 14, width: 150 }}>
          <HFFlyerSm title="Moon walk" meta="SAT · 8:15" imgKind="ink" tilt="tilt-ll" stamp="FULL MOON" width={150} />
        </div>
        <div style={{ position: 'absolute', top: 450, right: 0, width: 136 }}>
          <HFFlyerSm title="Film night" meta="SAT · 9 PM" imgKind="plum" tilt="tilt-r" stamp="BYOB" stampKind="sage" width={136} />
        </div>
        <div style={{ position: 'absolute', top: 650, left: '18%', width: 150 }}>
          <HFFlyerSm title="Run club" meta="SAT · 6 AM" imgKind="sage" tilt="tilt-l" stamp="WEEKLY" stampKind="sage" width={150} />
        </div>

        {/* a sticky note */}
        <div className="hand" style={{
          position: 'absolute', top: 410, left: '50%', transform: 'translateX(-50%) rotate(-3deg)',
          background: 'var(--mustard)', padding: '6px 10px',
          fontSize: 14, color: 'var(--ink)',
          border: '1px solid var(--ink)',
          boxShadow: '2px 2px 0 var(--ink)',
          width: 120, textAlign: 'center',
        }}>
          ~ love these ~
        </div>
      </div>

      <div className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>load older · scroll down</div>
    </div>
    <HFBottomNav active="home" />
  </HFPhone>
);

const HiMap = () => (
  <HFPhone>
    <HFTopbar right={<div className="row gap-8"><div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>☷</div></div>} />

    <div style={{ height: 'calc(100% - 68px - 64px)', position: 'relative' }}>
      <HFMapBg height="100%">
        {/* me */}
        <div className="pin" style={{ left: '45%', top: '55%' }}>
          <div className="pin-me" />
        </div>
        {/* radius circle */}
        <div style={{
          position: 'absolute', left: '45%', top: '55%',
          width: 240, height: 240,
          transform: 'translate(-50%, -50%)',
          border: '1.5px dashed rgba(200,85,54,0.4)',
          borderRadius: '50%',
          background: 'rgba(200,85,54,0.04)',
        }} />
        {/* pins */}
        {[
          { left: '30%', top: '38%', kind: '', icon: '☕', label: 'KILN' },
          { left: '62%', top: '30%', kind: 'sage', icon: '☷', label: 'BOOK' },
          { left: '70%', top: '62%', kind: 'plum', icon: '♪', label: 'MIC' },
          { left: '25%', top: '70%', kind: 'mustard', icon: '⇡', label: 'RUN' },
          { left: '82%', top: '45%', kind: 'ink', icon: '◐', label: 'FILM' },
        ].map((p, i) => (
          <div key={i} className="pin" style={{ left: p.left, top: p.top }}>
            <div style={{ position: 'relative' }}>
              <div className={`pin-dot ${p.kind}`}>{p.icon}</div>
              <div className="pin-tail" />
            </div>
            {i === 0 && (
              <div className="stamp stamp-ink" style={{ position: 'absolute', top: -8, left: 28, fontSize: 8, padding: '2px 5px', whiteSpace: 'nowrap' }}>{p.label}</div>
            )}
          </div>
        ))}
      </HFMapBg>

      {/* top chips */}
      <div className="row gap-6" style={{
        position: 'absolute', top: 12, left: 14, right: 14, flexWrap: 'nowrap', overflowX: 'auto',
      }}>
        <span className="pill pill-fill" style={{ padding: '5px 10px', fontSize: 9 }}>ALL · 22</span>
        <span className="pill" style={{ padding: '5px 10px', fontSize: 9 }}>TONIGHT</span>
        <span className="pill" style={{ padding: '5px 10px', fontSize: 9 }}>WKND</span>
        <span className="pill" style={{ padding: '5px 10px', fontSize: 9 }}>FREE</span>
        <span className="pill" style={{ padding: '5px 10px', fontSize: 9 }}>ARTS</span>
      </div>

      {/* radius */}
      <div className="card card-sh-sm" style={{
        position: 'absolute', top: 60, right: 14, padding: '6px 8px',
      }}>
        <div className="tab" style={{ fontSize: 8, marginBottom: 4 }}>RADIUS</div>
        <div className="col gap-2">
          {['2','5','10','20'].map((r, i) => (
            <div key={r} className={`tab ${i === 1 ? 'c-terra' : ''}`} style={{ fontSize: 10, padding: '2px 0', fontWeight: i === 1 ? 700 : 400 }}>
              {i === 1 ? '● ' : '○ '}{r} km
            </div>
          ))}
        </div>
      </div>

      {/* zoom controls */}
      <div className="col gap-4" style={{ position: 'absolute', bottom: 200, right: 14 }}>
        <div className="icon-box" style={{ width: 34, height: 34 }}>＋</div>
        <div className="icon-box" style={{ width: 34, height: 34 }}>−</div>
        <div className="icon-box" style={{ width: 34, height: 34, color: 'var(--terra)' }}>◎</div>
      </div>

      {/* floating event card */}
      <div className="card card-sh" style={{
        position: 'absolute', left: 14, right: 14, bottom: 14,
        padding: 14,
      }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stamp stamp-terra">TONIGHT · 6:30 PM</span>
          <span className="tab">460M W · 6 MIN WALK</span>
        </div>
        <div className="row gap-10" style={{ marginTop: 10, alignItems: 'flex-start' }}>
          <HFImage kind="terra" height={64} style={{ width: 64, flexShrink: 0 }} />
          <div className="col" style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Kiln & chai</div>
            <div className="tab" style={{ marginTop: 4 }}>POTTERY · SUNSET · THE OLD KILN</div>
            <div className="row gap-4" style={{ marginTop: 6, alignItems: 'center' }}>
              <HFAvatar letter="M" size={18} bg="var(--mustard)" />
              <span className="mono" style={{ fontSize: 9 }}>Meera · 13 going</span>
            </div>
          </div>
        </div>
        <div className="row gap-6" style={{ marginTop: 12 }}>
          <span className="btn btn-ghost btn-sm" style={{ flex: 1 }}>DETAILS</span>
          <span className="btn btn-terra btn-sm" style={{ flex: 1.2 }}>RSVP · I'M IN</span>
        </div>
      </div>
    </div>
    <HFBottomNav active="map" />
  </HFPhone>
);

const HiHood = () => (
  <HFPhone>
    <HFTopbar />
    <div style={{ padding: '0 18px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      <span className="tab">YOUR BLOCK · 2 KM</span>
      <h1 className="display" style={{ fontSize: 42, marginTop: 4 }}>
        Lodi <span className="serif c-terra">block.</span>
      </h1>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>218 neighbours · 7 events today</span>
        <span className="pill pill-ghost" style={{ fontSize: 8, padding: '3px 8px' }}>CHANGE HOOD</span>
      </div>

      <HFSep label="today's pulse" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card tint-terra" style={{ padding: 12 }}>
          <div className="display" style={{ fontSize: 32, color: 'var(--terra-deep)' }}>7</div>
          <span className="tab">EVENTS TODAY</span>
        </div>
        <div className="card tint-sage" style={{ padding: 12 }}>
          <div className="display" style={{ fontSize: 32, color: 'var(--sage)' }}>12</div>
          <span className="tab">NEW THIS WEEK</span>
        </div>
        <div className="card tint-mustard" style={{ padding: 12 }}>
          <div className="display" style={{ fontSize: 32, color: 'var(--ink)' }}>3</div>
          <span className="tab">NEW NEIGHBOURS</span>
        </div>
        <div className="card tint-plum" style={{ padding: 12 }}>
          <div className="display" style={{ fontSize: 32, color: 'var(--plum)' }}>◎</div>
          <span className="tab">SEE ON MAP →</span>
        </div>
      </div>

      <HFSep label="noticeboard" />
      <div className="col gap-10">
        {[
          { kind: 'ASK', by: 'meera · 2h', text: 'anyone have a spare kiln brick?', color: 'terra' },
          { kind: 'OFFER', by: 'kabir · 6h', text: '4 tomato saplings, free to a home.', color: 'sage' },
          { kind: 'LOST', by: 'raghu · 1d', text: 'grey cat near gate 4?', color: 'paper' },
        ].map((n, i) => (
          <div key={i} className="card card-sh-sm" style={{ padding: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`stamp stamp-${n.color}`}>{n.kind}</span>
              <span className="tab">{n.by}</span>
            </div>
            <p className="hand" style={{ fontSize: 19, marginTop: 8, color: 'var(--ink-2)', lineHeight: 1.2 }}>
              {n.text}
            </p>
            <div className="row gap-4" style={{ marginTop: 8 }}>
              <span className="pill pill-ghost" style={{ fontSize: 8, padding: '3px 8px' }}>♡ 4</span>
              <span className="pill pill-ghost" style={{ fontSize: 8, padding: '3px 8px' }}>✎ REPLY</span>
            </div>
          </div>
        ))}
      </div>

      <div className="btn btn-terra" style={{ marginTop: 14 }}>＋ PIN SOMETHING TO THE BOARD</div>

      <HFSep label="regulars" />
      <div className="row gap-10" style={{ overflowX: 'auto', paddingBottom: 6 }}>
        {[['Meera','M','var(--terra)','HOST'],['Arjun','A','var(--sage)','REG'],['Elias','E','var(--mustard)','HOST'],['Raghu','R','var(--plum)','NEW'],['Jaya','J','var(--sky)','REG'],['Kabir','K','var(--terra-2)','HOST']].map(([n, l, bg, tag], i) => (
          <div key={i} className="col" style={{ alignItems: 'center', gap: 4, minWidth: 64, flexShrink: 0 }}>
            <HFAvatar letter={l} size={54} bg={bg} />
            <span className="mono" style={{ fontSize: 10 }}>{n}</span>
            <span className="tab" style={{ fontSize: 7 }}>{tag}</span>
          </div>
        ))}
      </div>

      <HFSep label="spots locals love" />
      <div className="col gap-8">
        {[
          ['The Old Kiln district', 'craft · heritage · 7 events', 'terra'],
          ['INA market', 'food · mornings · bazaar', 'mustard'],
          ['Lodi gardens', 'walk · picnic · run club', 'sage'],
        ].map(([n, s, c], i) => (
          <div key={i} className="row card" style={{ padding: 10, gap: 10, alignItems: 'center' }}>
            <HFImage kind={c} height={48} style={{ width: 48, flexShrink: 0 }} />
            <div className="col" style={{ flex: 1 }}>
              <span className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>{n}</span>
              <span className="tab" style={{ marginTop: 2 }}>{s}</span>
            </div>
            <span style={{ fontSize: 18, color: 'var(--ink-soft)' }}>→</span>
          </div>
        ))}
      </div>
    </div>
    <HFBottomNav active="hood" />
  </HFPhone>
);

Object.assign(window, { HiHome, HiFeed, HiMap, HiHood });
