// Event discovery feed + event detail + map wireframes

const FeedA = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="box" style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>⌕</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>meetups near me after work...</span>
      </div>
      <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        {['all', 'running', 'arts', 'skills', 'community', 'wellness', 'food'].map((t, i) => (
          <span key={t} className={`pill ${i === 0 ? 'pill-fill' : ''}`}>{t}</span>
        ))}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span className="label">12 happenings · 2 km</span>
        <span className="pill pill-terra">☷ feed / ◎ map</span>
      </div>

      <div className="col gap-14" style={{ marginTop: 10 }}>
        <EventFlyer title="Kiln & chai" meta="Tonight · 6:30 · 400m" host="Meera" pill="STARTS SOON" tint="terra" tilt="tilt-l" />
        <EventFlyer title="Bookswap @ park" meta="Wed 5pm · Lodi block" host="Arjun" pill="6 SPOTS" tint="sage" tilt="tilt-r" />
        <EventFlyer title="Sunday sabzi hunt" meta="Sun 7am · INA" host="Kabir" pill="FREE" tint="terra" tilt="tilt-l" />
      </div>
    </div>
    <BottomTab active="home" />
  </Phone>
);

const FeedB = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <h2 className="serif" style={{ fontSize: 22, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Feed · bulletin board
      </h2>
      <span className="label">scroll or swipe, like a real wall</span>

      {/* staggered flyer grid */}
      <div style={{ position: 'relative', marginTop: 16, minHeight: 560 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '48%' }}>
          <EventFlyer title="Kiln & chai" meta="6:30" host="M" pill="TONIGHT" tint="terra" tilt="tilt-ll" />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 0, width: '48%' }}>
          <EventFlyer title="Bookswap" meta="wed 5" host="A" pill="SOON" tint="sage" tilt="tilt-rr" />
        </div>
        <div style={{ position: 'absolute', top: 200, left: 4, width: '48%' }}>
          <EventFlyer title="Open mic" meta="fri 8" host="R" pill="3 SPOTS" tint="sage" tilt="tilt-r" />
        </div>
        <div style={{ position: 'absolute', top: 220, right: 6, width: '48%' }}>
          <EventFlyer title="Run club" meta="sat 6am" host="J" pill="WEEKLY" tint="terra" tilt="tilt-l" />
        </div>
        <div style={{ position: 'absolute', top: 420, left: '8%', width: '48%' }}>
          <EventFlyer title="Film night" meta="sat 9pm" host="Z" pill="BYOB" tint="terra" tilt="tilt-ll" />
        </div>
      </div>
    </div>
    <BottomTab active="home" />
  </Phone>
);

const FeedC = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <h1 className="serif" style={{ fontSize: 26, marginTop: 6, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Today · Tue 22
      </h1>
      <span className="label">time-lane view · next 7 days</span>

      <div className="col gap-10" style={{ marginTop: 14 }}>
        {[
          ['NOW', 'Evening chai pop-up', '400m · Meera', 'terra'],
          ['6:30', 'Kiln & chai', 'The Old Kiln · 460m', 'terra'],
          ['7:00', 'Open mic @ dhaba', '900m · 2 spots', 'sage'],
          ['8:15', 'Full moon walk', '1.2km · gate 4', 'sage'],
        ].map(([t, n, m, c]) => (
          <div key={t} className="row" style={{ alignItems: 'stretch', gap: 10 }}>
            <div className="col" style={{
              width: 54, alignItems: 'center', justifyContent: 'center',
              background: c === 'terra' ? 'rgba(196,90,58,0.12)' : 'rgba(107,122,90,0.12)',
              border: `1.5px solid var(--${c === 'terra' ? 'terra' : 'sage'})`,
            }}>
              <span className="serif" style={{ fontSize: 18, color: `var(--${c === 'terra' ? 'terra' : 'sage'})` }}>{t}</span>
              <span className="label" style={{ fontSize: 8 }}>pm</span>
            </div>
            <div className="col box" style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
              <div className="serif" style={{ fontSize: 16 }}>{n}</div>
              <div className="label" style={{ marginTop: 2 }}>{m}</div>
            </div>
          </div>
        ))}
      </div>

      <Divider label="wed 23 ·" />
      <Lines count={3} />
    </div>
    <BottomTab active="home" />
  </Phone>
);

// ─── Event Detail ───

const EventA = () => (
  <Phone>
    <TopNav right="Back" />
    <div style={{ padding: 0, height: 'calc(100% - 44px)', overflowY: 'auto', paddingBottom: 70 }}>
      <div className="img-terra" style={{ height: 180, margin: '0 16px', borderRadius: 0 }}>
        HERO · KILN DOORWAY
      </div>
      <div style={{ padding: '14px 16px' }}>
        <span className="label">HERITAGE SERIES · VOL IV</span>
        <h2 className="serif" style={{ fontSize: 32, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic', lineHeight: 1 }}>
          Reconnect with<br />the earth.
        </h2>
        <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <span className="pill">♨ pottery</span>
          <span className="pill">◐ sunset</span>
          <span className="pill">2.5 hrs</span>
        </div>

        <Divider label="when & where" />

        <div className="col gap-10">
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <span className="stamp stamp-fill">☼</span>
            <div className="col">
              <span className="serif" style={{ fontSize: 16 }}>Oct 24 · sunset</span>
              <span className="label">5:30 – 8:00 pm</span>
            </div>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <span className="stamp stamp-terra">◉</span>
            <div className="col">
              <span className="serif" style={{ fontSize: 16 }}>The Old Kiln</span>
              <span className="label">42 heritage ln · 460m away</span>
            </div>
          </div>
        </div>

        <SketchMap height={120} pins={1} />

        <Divider label="what's the vibe" />
        <p className="serif" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Step back to when creation was a chat between hand & soil. Not just pots — patience, fire, stories. Come dusty, leave warm.
        </p>

        <Divider label="who's hosting" />
        <div className="row box-fill" style={{ padding: 10, gap: 10, alignItems: 'center' }}>
          <div className="circle" style={{ width: 38, height: 38, background: 'var(--mustard)' }}>E</div>
          <div className="col">
            <span className="serif" style={{ fontSize: 15 }}>Elias T. — master kilner</span>
            <span className="label">40 yrs · 23 events</span>
          </div>
        </div>

        <Divider label="who's coming" />
        <div className="row gap-4" style={{ alignItems: 'center' }}>
          {['A','B','C','D'].map((l, i) => (
            <div key={l} className="circle" style={{
              width: 26, height: 26,
              background: ['var(--mustard)','var(--terra-soft)','var(--sage)','var(--sky)'][i],
              marginLeft: i ? -8 : 0, fontSize: 10,
            }}>{l}</div>
          ))}
          <span className="mono" style={{ fontSize: 11, marginLeft: 8 }}>+12 going</span>
        </div>
      </div>

      <div style={{
        position: 'sticky', bottom: 54,
        padding: '10px 16px',
        background: 'var(--paper)',
        borderTop: '1.5px solid var(--ink)',
      }}>
        <div className="row gap-8">
          <div className="btn btn-out" style={{ flex: 0.6 }}>◎ save</div>
          <div className="btn btn-terra" style={{ flex: 1 }}>RSVP · free</div>
        </div>
      </div>
    </div>
    <BottomTab active="home" />
  </Phone>
);

const EventB = () => (
  <Phone bg="var(--paper-deep)">
    <TopNav right="← back" />
    <div style={{ padding: '8px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      {/* flyer-style */}
      <div className="box" style={{
        background: 'var(--paper)',
        padding: 14,
        position: 'relative',
        boxShadow: '3px 3px 0 var(--ink)',
      }}>
        <div className="tape" style={{ top: -10, left: 20, transform: 'rotate(-5deg)' }} />
        <div className="tape" style={{ top: -10, right: 20, transform: 'rotate(6deg)' }} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="label">EV · #0247</span>
          <span className="stamp stamp-terra">TONIGHT</span>
        </div>
        <h1 style={{ fontSize: 48, marginTop: 8, lineHeight: 0.9 }}>Kiln <br /><em className="serif" style={{ color: 'var(--terra)' }}>& chai</em></h1>
        <div className="label" style={{ marginTop: 6 }}>pottery · sunset · heritage ln</div>

        <div className="img-terra" style={{ height: 140, marginTop: 12 }}>
          HERO IMAGE
        </div>

        <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <div className="col">
            <span className="label">WHEN</span>
            <span className="serif" style={{ fontSize: 16 }}>oct 24 · 5:30p</span>
          </div>
          <div className="col">
            <span className="label">WHERE</span>
            <span className="serif" style={{ fontSize: 16 }}>old kiln · 460m</span>
          </div>
          <div className="col">
            <span className="label">PRICE</span>
            <span className="serif" style={{ fontSize: 16 }}>pay-what</span>
          </div>
        </div>
      </div>

      <Divider label="story" />
      <p className="serif" style={{ fontSize: 14, lineHeight: 1.55 }}>
        Step back to when creation was a conversation between hand and soil. Come dusty, leave warm.
      </p>

      <Divider label="host" />
      <div className="row box-fill" style={{ padding: 10, gap: 10 }}>
        <div className="circle" style={{ width: 38, height: 38, background: 'var(--mustard)' }}>E</div>
        <div className="col" style={{ flex: 1 }}>
          <span className="serif" style={{ fontSize: 15 }}>Elias Thorne</span>
          <span className="label">master kilner · ★★★★ · 23 events</span>
        </div>
      </div>

      <Divider label="13 going" />
      <div className="row" style={{ flexWrap: 'wrap', gap: 4 }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <div key={i} className="circle" style={{
            width: 28, height: 28, fontSize: 10,
            background: ['var(--mustard)','var(--terra-soft)','var(--sage)','var(--sky)','var(--bruise)'][i % 5],
          }}>{String.fromCharCode(65 + i)}</div>
        ))}
      </div>

      <div className="row gap-8" style={{ marginTop: 16 }}>
        <div className="btn btn-out" style={{ flex: 1 }}>share</div>
        <div className="btn btn-terra" style={{ flex: 1.5 }}>RSVP · I'm in →</div>
      </div>
    </div>
    <BottomTab active="home" />
  </Phone>
);

// Map / explore
const MapA = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <h2 className="serif" style={{ fontSize: 22, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        What's happening round you.
      </h2>
      <div className="row gap-6" style={{ marginTop: 8 }}>
        <span className="pill">2 km</span>
        <span className="pill pill-fill">5 km</span>
        <span className="pill">10 km</span>
        <span className="pill">20</span>
      </div>
      <SketchMap height={360} pins={8} />
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        <span className="label">8 pins shown</span>
        <span className="pill pill-terra">list view →</span>
      </div>
    </div>
    <BottomTab active="map" />
  </Phone>
);

const MapB = () => (
  <Phone>
    <TopNav />
    <div style={{ height: 'calc(100% - 44px - 54px)', position: 'relative' }}>
      <SketchMap height={540} pins={10} />

      {/* floating card */}
      <div className="box-fill" style={{
        position: 'absolute', left: 14, right: 14, bottom: 14,
        padding: 12, boxShadow: '2px 2px 0 var(--ink)',
      }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stamp stamp-terra">TONIGHT · 6:30</span>
          <span className="label">460m W</span>
        </div>
        <div className="serif" style={{ fontSize: 20, marginTop: 6 }}>Kiln & chai</div>
        <div className="label" style={{ marginTop: 2 }}>pottery · sunset session</div>
        <div className="row gap-6" style={{ marginTop: 10 }}>
          <div className="btn btn-out" style={{ flex: 1, padding: '8px 10px' }}>details</div>
          <div className="btn btn-terra" style={{ flex: 1.2, padding: '8px 10px' }}>RSVP →</div>
        </div>
      </div>

      {/* top filter chips */}
      <div className="row gap-6" style={{ position: 'absolute', top: 10, left: 12, right: 12, flexWrap: 'wrap' }}>
        <span className="pill pill-fill">all</span>
        <span className="pill">tonight</span>
        <span className="pill">wknd</span>
        <span className="pill">free</span>
      </div>
    </div>
    <BottomTab active="map" />
  </Phone>
);

Object.assign(window, { FeedA, FeedB, FeedC, EventA, EventB, MapA, MapB });
