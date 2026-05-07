// Hi-fi Profile (id-card + badges) + Host flow + Onboarding

const HiProfile = () => (
  <HFPhone>
    <HFTopbar
      right={
        <div className="row gap-8">
          <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>✎</div>
          <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>⚙</div>
        </div>
      }
    />
    <div style={{ padding: '0 18px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>

      {/* ID card */}
      <div className="card card-sh tilt-l" style={{ padding: 16, marginTop: 10, position: 'relative', background: 'var(--paper-card)' }}>
        <span className="tape" style={{ top: -10, left: '38%', transform: 'rotate(3deg)', width: 66 }} />

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="tab">ILAAKA · LOCAL ID · №0142</span>
          <span className="stamp stamp-terra">HOST</span>
        </div>

        <div className="row gap-14" style={{ marginTop: 14, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <HFImage kind="terra" height={84} style={{ width: 74 }}>
              <span style={{ fontSize: 28, fontFamily: 'Fraunces, serif', fontWeight: 700 }}>A</span>
            </HFImage>
            <div className="stamp-mark" style={{
              position: 'absolute', bottom: -12, right: -14,
              width: 38, height: 38, fontSize: 8,
              background: 'var(--paper-card)',
            }}>
              LVL<br />4
            </div>
          </div>
          <div className="col" style={{ flex: 1 }}>
            <h2 className="display" style={{ fontSize: 30, lineHeight: 0.95 }}>Ambi <span className="serif c-terra">R.</span></h2>
            <div className="tab" style={{ marginTop: 4 }}>◉ LODI BLOCK · SINCE JAN '26</div>
            <p className="hand" style={{ fontSize: 17, marginTop: 8, color: 'var(--ink-2)', lineHeight: 1.2 }}>
              slow walks, hot chai, bad films.
            </p>
          </div>
        </div>

        <div className="solidline" style={{ margin: '14px 0 10px' }} />

        <div className="row" style={{ justifyContent: 'space-around' }}>
          {[['47', 'went'],['8', 'hosted'],['218', 'in hood'],['4.9', '★']].map(([n, l]) => (
            <div key={l} className="col" style={{ alignItems: 'center' }}>
              <span className="display" style={{ fontSize: 22, color: 'var(--ink)' }}>{n}</span>
              <span className="tab" style={{ fontSize: 8 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <HFSep label="trust & badges · 8 / 24" />
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <HFBadge icon="✓" label="VERIFIED" color="var(--sage)" />
        <HFBadge icon="♨" label="KILN CREW" color="var(--terra)" />
        <HFBadge icon="☕" label="HOST 5×" color="var(--mustard)" />
        <HFBadge icon="☷" label="EARLY BIRD" color="var(--plum)" />
        <HFBadge icon="✿" label="GREEN HAND" color="var(--sage)" />
        <HFBadge icon="♪" label="OPEN MIC" earned={false} />
        <HFBadge icon="⇡" label="RUN CLUB" earned={false} />
        <HFBadge icon="◐" label="FILM NIGHT" earned={false} />
      </div>

      <div className="row" style={{ alignItems: 'center', gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1, height: 10, border: '1.5px solid var(--ink)', background: 'var(--paper-card)', position: 'relative' }}>
          <div style={{ width: '33%', height: '100%', background: 'var(--terra)' }} />
        </div>
        <span className="tab">33% TO LVL 5</span>
      </div>

      <HFSep label="vibes i'm drawn to" />
      <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
        {[
          ['slow walks','terra'],['hot chai','mustard'],['bad films','plum'],
          ['old books','sage'],['kiln','terra'],['street food','mustard'],
          ['urdu poetry','plum'],['+ add','ghost'],
        ].map(([t, c], i) => (
          <span key={i} className={`pill ${c === 'ghost' ? 'pill-ghost' : ''}`} style={{
            background: c === 'ghost' ? 'transparent' : `var(--${c === 'mustard' ? 'mustard' : c === 'terra' ? 'terra' : c === 'plum' ? 'plum' : 'sage'})`,
            color: c === 'ghost' ? 'var(--ink)' : 'var(--cream)',
            border: c === 'ghost' ? '1.4px dashed var(--ink-soft)' : `1.4px solid var(--${c === 'mustard' ? 'mustard' : c === 'terra' ? 'terra' : c === 'plum' ? 'plum' : 'sage'})`,
            padding: '5px 11px', fontSize: 10,
          }}>{t}</span>
        ))}
      </div>

      <HFSep label="things i've made happen" />
      <div className="col gap-10">
        {[
          ['Slow sunday', 'oct 13 · 22 came · ★ 4.9', 'terra', 'HOSTED'],
          ['Kiln night', 'sep 28 · 14 came · ★ 4.8', 'mustard', 'HOSTED'],
          ['Chai pop-up', 'sep 14 · 18 came · ★ 4.7', 'sage', 'HOSTED'],
        ].map(([n, m, c, tag], i) => (
          <div key={i} className="row card card-sh-sm" style={{ padding: 10, gap: 10, alignItems: 'center' }}>
            <HFImage kind={c} height={54} style={{ width: 54, flexShrink: 0 }} />
            <div className="col" style={{ flex: 1 }}>
              <span className={`stamp stamp-${c === 'terra' ? 'terra' : c === 'sage' ? 'sage' : 'ink'}`} style={{ alignSelf: 'flex-start', fontSize: 8, padding: '2px 6px' }}>{tag}</span>
              <span className="serif" style={{ fontSize: 18, marginTop: 3, lineHeight: 1 }}>{n}</span>
              <span className="tab" style={{ marginTop: 2 }}>{m}</span>
            </div>
            <span className="pill pill-ghost" style={{ fontSize: 8, padding: '3px 8px' }}>AGAIN?</span>
          </div>
        ))}
      </div>

      <HFSep label="memory wall · apr" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {['terra','sage','mustard','plum','terra','sage'].map((c, i) => (
          <HFImage key={i} kind={c} height={90}>
            <span style={{ fontSize: 8 }}>{['JAN','FEB','MAR','APR','MAY','JUN'][i]}</span>
          </HFImage>
        ))}
      </div>

      <div className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>SEE ALL MEMORIES →</div>
    </div>
    <HFBottomNav active="me" />
  </HFPhone>
);

// ─── Host flow — step 1 (story) ───
const HiHost1 = () => (
  <HFPhone>
    <div className="hf-topbar">
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>×</div>
        <span className="tab">HOST · NEW EVENT</span>
      </div>
      <div className="row gap-6">
        <span className="pill pill-ghost" style={{ fontSize: 9, padding: '4px 9px' }}>QUICK ⌄</span>
      </div>
    </div>

    <div style={{ padding: '8px 18px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      {/* steps */}
      <div className="row" style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
        {['story','place','look','ship'].map((l, i) => (
          <React.Fragment key={l}>
            <div className="col" style={{ alignItems: 'center', gap: 3 }}>
              <div className={`num-step ${i === 0 ? '' : 'todo'}`}>{i + 1}</div>
              <span className="tab" style={{ fontSize: 7 }}>{l}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1.5, background: 'var(--ink-faint)', marginTop: -14 }} />}
          </React.Fragment>
        ))}
      </div>

      <span className="tab" style={{ display: 'block', marginTop: 18 }}>STEP 1 OF 4 · THE STORY</span>
      <h2 className="display" style={{ fontSize: 32, marginTop: 6 }}>
        what are you gathering <span className="serif c-terra">folks for?</span>
      </h2>
      <p className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>
        a name and a feeling. that's it for now.
      </p>

      <div className="col gap-14" style={{ marginTop: 20 }}>
        <div className="col gap-6">
          <span className="tab">GIVE IT A NAME</span>
          <div className="card" style={{ padding: '14px 14px' }}>
            <span className="serif" style={{ fontSize: 22, color: 'var(--ink)' }}>Kiln & chai</span>
            <span style={{ color: 'var(--terra)', marginLeft: 4 }}>|</span>
          </div>
          <span className="tab c-ink-faint" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>
            12 / 40
          </span>
        </div>

        <div className="col gap-6">
          <span className="tab">THE VIBE · 1-2 LINES</span>
          <div className="card" style={{ padding: '12px 14px', minHeight: 96 }}>
            <span className="hand" style={{ fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.3 }}>
              pottery, sunset chai, and a story or two round the kiln. come dusty, leave warm.
            </span>
          </div>
        </div>

        <div className="col gap-8">
          <span className="tab">PICK A VIBE</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['♨','craft','pottery · print · paint','terra', true],
              ['☕','hang','chai · chat · chill','mustard', false],
              ['♪','sound','mic · jam · vinyl','plum', false],
              ['⇡','move','run · walk · yoga','sage', false],
            ].map(([ic, n, s, c, active], i) => (
              <div key={i} className="card" style={{
                padding: 12,
                borderWidth: active ? 2 : 1.5,
                borderColor: active ? `var(--${c})` : 'var(--ink)',
                background: active ? `rgba(${c === 'terra' ? '200,85,54' : c === 'mustard' ? '212,167,58' : c === 'plum' ? '107,69,104' : '108,125,87'},0.14)` : 'var(--paper-card)',
              }}>
                <div className="row gap-6" style={{ alignItems: 'center' }}>
                  <div className="icon-box" style={{ width: 26, height: 26, fontSize: 12 }}>{ic}</div>
                  <span className="serif" style={{ fontSize: 16 }}>{n}</span>
                  {active && <span style={{ marginLeft: 'auto', color: `var(--${c})` }}>✓</span>}
                </div>
                <span className="tab" style={{ fontSize: 7, marginTop: 6, display: 'block' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 24 }}>
        <span className="btn btn-ghost btn-sm" style={{ flex: 1 }}>SAVE DRAFT</span>
        <span className="btn btn-terra" style={{ flex: 1.8 }}>NEXT · PLACE & TIME →</span>
      </div>
    </div>
  </HFPhone>
);

// ─── Host flow — step 2 (place & time) ───
const HiHost2 = () => (
  <HFPhone>
    <div className="hf-topbar">
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>←</div>
        <span className="tab">STEP 2 · PLACE & TIME</span>
      </div>
      <span className="tab">2/4</span>
    </div>

    <div style={{ padding: '8px 18px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      <div className="row" style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
        {['story','place','look','ship'].map((l, i) => (
          <React.Fragment key={l}>
            <div className="col" style={{ alignItems: 'center', gap: 3 }}>
              <div className={`num-step ${i === 0 ? 'done' : i === 1 ? '' : 'todo'}`}>{i === 0 ? '✓' : i + 1}</div>
              <span className="tab" style={{ fontSize: 7 }}>{l}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1.5, background: i === 0 ? 'var(--sage)' : 'var(--ink-faint)', marginTop: -14 }} />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: 28, marginTop: 18 }}>
        drop a pin, <span className="serif c-terra">pick a day.</span>
      </h2>

      <span className="tab" style={{ display: 'block', marginTop: 14 }}>DROP A PIN</span>
      <div className="card" style={{ marginTop: 6, overflow: 'hidden', position: 'relative' }}>
        <HFMapBg height={170}>
          <div className="pin" style={{ left: '50%', top: '55%' }}>
            <div style={{ position: 'relative' }}>
              <div className="pin-dot" style={{ width: 36, height: 36, fontSize: 16, background: 'var(--terra)' }}>☕</div>
              <div className="pin-tail" />
            </div>
          </div>
        </HFMapBg>
        <span className="pill pill-fill" style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', fontSize: 9 }}>◉ MY LOCATION</span>
      </div>
      <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
        <span className="mono" style={{ fontSize: 11 }}>42 heritage lane, s-02 warehouse</span>
        <span className="tab c-terra">EDIT</span>
      </div>

      <HFSep label="when it happens" />

      <span className="tab">DATE</span>
      <div className="row gap-6" style={{ overflowX: 'auto', paddingBottom: 6, marginTop: 6 }}>
        {[
          ['TODAY','TUE 22', true],
          ['WED','APR 23', false],
          ['THU','APR 24', false],
          ['FRI','APR 25', false],
          ['SAT','APR 26', false],
          ['SUN','APR 27', false],
        ].map(([d1, d2, active], i) => (
          <div key={i} className="card" style={{
            padding: '8px 12px', minWidth: 62, flexShrink: 0, textAlign: 'center',
            background: active ? 'var(--terra)' : 'var(--paper-card)',
            color: active ? 'var(--cream)' : 'var(--ink)',
            borderColor: active ? 'var(--terra-deep)' : 'var(--ink)',
          }}>
            <div className="tab" style={{ fontSize: 8, color: active ? 'var(--cream)' : 'var(--ink-soft)' }}>{d1}</div>
            <div className="serif" style={{ fontSize: 14 }}>{d2}</div>
          </div>
        ))}
      </div>

      <div className="row gap-10" style={{ marginTop: 14 }}>
        <div className="col gap-4" style={{ flex: 1 }}>
          <span className="tab">START</span>
          <div className="card" style={{ padding: 10 }}>
            <span className="serif" style={{ fontSize: 18 }}>5:30 pm</span>
          </div>
        </div>
        <div className="col gap-4" style={{ flex: 1 }}>
          <span className="tab">END</span>
          <div className="card" style={{ padding: 10 }}>
            <span className="serif" style={{ fontSize: 18 }}>8:00 pm</span>
          </div>
        </div>
      </div>

      <HFSep label="capacity" />
      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <div className="icon-box" style={{ width: 40, height: 40, fontSize: 18 }}>−</div>
        <div className="col" style={{ flex: 1, alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 36, color: 'var(--terra)' }}>12</span>
          <span className="tab">PEOPLE MAX</span>
        </div>
        <div className="icon-box" style={{ width: 40, height: 40, fontSize: 18 }}>＋</div>
      </div>

      <div className="row gap-8" style={{ marginTop: 24 }}>
        <span className="btn btn-ghost btn-sm" style={{ flex: 1 }}>← BACK</span>
        <span className="btn btn-terra" style={{ flex: 1.8 }}>NEXT · THE LOOK →</span>
      </div>
    </div>
  </HFPhone>
);

// ─── Onboarding ───

const HiOnboard = () => (
  <HFPhone>
    <div style={{ height: '100%', padding: '44px 24px 30px', display: 'flex', flexDirection: 'column' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row gap-8" style={{ alignItems: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--terra)', border: '1.5px solid var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cream)', fontFamily: 'Fraunces', fontSize: 17, fontWeight: 700,
          }}>i</div>
          <span className="display" style={{ fontSize: 24 }}>ilaaka</span>
        </div>
        <span className="tab">SKIP</span>
      </div>

      <div style={{ marginTop: 32 }}>
        <span className="tab">WELCOME, NEIGHBOUR</span>
        <h1 className="display" style={{ fontSize: 54, marginTop: 8 }}>
          your hood,<br />
          <span className="serif c-terra">more alive.</span>
        </h1>
        <p className="serif" style={{ fontSize: 18, marginTop: 16, lineHeight: 1.4, color: 'var(--ink-2)' }}>
          3 steps. no feed. no ads. just what's actually happening in walking distance.
        </p>
      </div>

      {/* Preview flyers collage */}
      <div style={{ flex: 1, position: 'relative', marginTop: 14 }}>
        <div style={{ position: 'absolute', top: 10, left: -6, width: 130 }}>
          <HFFlyerSm title="Kiln & chai" meta="TONITE · 6:30" imgKind="terra" tilt="tilt-ll" stamp="TONITE" stampKind="terra" width={130} />
        </div>
        <div style={{ position: 'absolute', top: 4, right: -6, width: 128 }}>
          <HFFlyerSm title="Run club" meta="SAT · 6 AM" imgKind="sage" tilt="tilt-rr" stamp="WEEKLY" stampKind="sage" width={128} />
        </div>
        <div style={{ position: 'absolute', top: 190, left: '50%', transform: 'translateX(-50%)', width: 140 }}>
          <HFFlyerSm title="Open mic" meta="FRI · 8 PM" imgKind="plum" tilt="tilt-l" stamp="3 SPOTS" width={140} />
        </div>

        <div className="hand" style={{
          position: 'absolute', top: 150, left: 20, transform: 'rotate(-6deg)',
          fontSize: 18, color: 'var(--terra)',
        }}>
          ↙ real<br />&nbsp;&nbsp;events
        </div>
      </div>

      <div className="col gap-8" style={{ marginTop: 14 }}>
        <span className="btn btn-terra">CONTINUE WITH PHONE</span>
        <span className="btn btn-ghost btn-sm">CONTINUE WITH EMAIL</span>
      </div>
      <div className="row" style={{ marginTop: 12, justifyContent: 'center', gap: 4 }}>
        <span className="tab" style={{ color: 'var(--ink-soft)' }}>ALREADY IN?</span>
        <span className="tab c-terra">LOG IN</span>
      </div>
    </div>
  </HFPhone>
);

const HiOnboardHood = () => (
  <HFPhone>
    <div className="hf-topbar">
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <div className="icon-box" style={{ width: 36, height: 36, borderRadius: '50%' }}>←</div>
        <span className="tab">STEP 1 · WHERE YOU LIVE</span>
      </div>
      <span className="tab">1/3</span>
    </div>
    <div style={{ padding: '8px 20px 80px', height: 'calc(100% - 68px)', overflowY: 'auto' }}>
      <div className="row gap-6" style={{ marginTop: 4 }}>
        {[true, false, false].map((active, i) => (
          <div key={i} style={{
            flex: 1, height: 6,
            background: active ? 'var(--terra)' : 'var(--paper-2)',
            border: '1.5px solid var(--ink)',
          }} />
        ))}
      </div>

      <h2 className="display" style={{ fontSize: 36, marginTop: 18 }}>
        which hood is <span className="serif c-terra">home?</span>
      </h2>
      <p className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 8 }}>
        we use this to show what's actually walkable. never shared.
      </p>

      <div className="card" style={{ marginTop: 16, overflow: 'hidden' }}>
        <HFMapBg height={220}>
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 180, height: 180,
            border: '1.5px dashed var(--terra)',
            borderRadius: '50%',
            background: 'rgba(200,85,54,0.06)',
          }} />
          <div className="pin" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="pin-me" />
          </div>
        </HFMapBg>
      </div>

      <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <span className="pill pill-fill">◉ USE MY LOCATION</span>
        <span className="pill">⌕ SEARCH</span>
        <span className="pill">DROP PIN</span>
      </div>

      <HFSep label="how far counts as home?" />
      <div className="row gap-6">
        {['1','2','5','10','20'].map((r, i) => (
          <div key={r} className="card" style={{
            flex: 1, padding: '10px 4px', textAlign: 'center',
            background: i === 2 ? 'var(--terra)' : 'var(--paper-card)',
            color: i === 2 ? 'var(--cream)' : 'var(--ink)',
            borderColor: i === 2 ? 'var(--terra-deep)' : 'var(--ink)',
          }}>
            <div className="display" style={{ fontSize: 22 }}>{r}</div>
            <div className="tab" style={{ fontSize: 7, color: i === 2 ? 'var(--cream)' : 'var(--ink-soft)' }}>KM</div>
          </div>
        ))}
      </div>
      <p className="hand" style={{ fontSize: 16, color: 'var(--terra)', marginTop: 10, textAlign: 'center' }}>
        ~ 5 km = a comfy walk ~
      </p>

      <div className="btn btn-terra" style={{ marginTop: 20 }}>NEXT · WHAT YOU'RE INTO →</div>
    </div>
  </HFPhone>
);

Object.assign(window, { HiProfile, HiHost1, HiHost2, HiOnboard, HiOnboardHood });
