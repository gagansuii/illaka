// Home / landing wireframes

const HomeA = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <span className="label">☼ Tue · your hood</span>
      <h1 style={{ fontSize: 44, marginTop: 6 }}>what's happening <em className="serif" style={{ color: 'var(--terra)' }}>round the corner</em></h1>

      <Divider label="Near you · now" />

      <div className="col gap-12">
        <EventFlyer title="Kiln & chai" meta="Tonight · 6:30pm · 400m" host="Meera" pill="STARTS 6PM" tint="terra" tilt="tilt-l" />
        <EventFlyer title="Bookswap @ park" meta="Wed · 5pm · Lodi block" host="Arjun" pill="6 SPOTS" tint="sage" tilt="tilt-r" />
      </div>

      <Divider label="Pinned on the wall" />

      <div className="row gap-8" style={{ overflowX: 'auto', paddingBottom: 8 }}>
        {['Run club', 'Open mic', 'Film night', 'Skill swap'].map((t, i) => (
          <div key={t} className={`box-fill ${i % 2 ? 'tilt-r' : 'tilt-l'}`} style={{
            minWidth: 100, padding: 8, flexShrink: 0,
          }}>
            <div className="img-ph" style={{ height: 48, marginBottom: 6, fontSize: 8 }}>FLYER</div>
            <div className="serif" style={{ fontSize: 14 }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
    <BottomTab active="home" />
  </Phone>
);

const HomeB = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <span className="label">◎ live · 2.1 km radius</span>
      <h2 className="serif" style={{ fontSize: 28, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Map-first,<br />as it should be.
      </h2>
      <SketchMap height={200} pins={5} />
      <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <span className="pill pill-fill">◎ 2 km</span>
        <span className="pill">5 km</span>
        <span className="pill">10 km</span>
        <span className="pill">walk</span>
      </div>

      <Divider label="tap pin → see card" />
      <div className="box-fill" style={{ padding: 10 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="stamp stamp-terra">TONIGHT</span>
          <span className="label">460 m · W</span>
        </div>
        <div className="serif" style={{ fontSize: 22, marginTop: 6 }}>Kiln & chai</div>
        <div className="label" style={{ marginTop: 4 }}>6:30pm · The Old Kiln</div>
        <div className="row gap-6" style={{ marginTop: 10 }}>
          <div className="btn btn-terra" style={{ flex: 1 }}>RSVP</div>
          <div className="btn btn-out" style={{ flex: 1 }}>details</div>
        </div>
      </div>
    </div>
    <BottomTab active="map" />
  </Phone>
);

const HomeC = () => (
  <Phone bg="var(--paper-deep)">
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="box-ink" style={{ padding: 14, marginTop: 4 }}>
        <span className="label" style={{ color: 'var(--mustard)' }}>◉ JOIN SOMETHING TONIGHT</span>
        <h2 className="serif" style={{ fontSize: 30, marginTop: 4, color: 'var(--paper)', fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
          3 things near you are starting soon.
        </h2>
        <div className="row gap-6" style={{ marginTop: 12 }}>
          <div className="btn" style={{ background: 'var(--terra)', color: 'var(--paper)', borderColor: 'var(--paper)', flex: 1 }}>SHOW ME</div>
        </div>
      </div>

      <div className="col gap-10" style={{ marginTop: 14 }}>
        {[
          ['6:30', 'Kiln & chai', '400m · The Old Kiln'],
          ['7:00', 'Open mic @ Dhaba', '900m · 2 spots'],
          ['7:30', 'Full moon walk', '1.2km · meet gate 4'],
        ].map(([t, n, m]) => (
          <div key={t} className="row box-fill" style={{ padding: 10, alignItems: 'center', gap: 10 }}>
            <div className="col" style={{ alignItems: 'center', minWidth: 48 }}>
              <span className="serif" style={{ fontSize: 18, color: 'var(--terra)' }}>{t}</span>
              <span className="label">pm</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 16 }}>{n}</div>
              <div className="label">{m}</div>
            </div>
            <span className="pill pill-terra">→</span>
          </div>
        ))}
      </div>

      <Divider label="later this week" />
      <Lines count={3} />
    </div>
    <BottomTab active="home" />
  </Phone>
);

// Desktop home — bulletin wall
const HomeDesktop = () => (
  <div className="wf" style={{ width: '100%', height: '100%', overflowY: 'auto', padding: 24 }}>
    <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <div className="circle" style={{ width: 28, height: 28, background: 'var(--terra)' }}>
          <span style={{ fontSize: 12, color: 'var(--paper)' }}>✦</span>
        </div>
        <span className="serif" style={{ fontSize: 26 }}>ilaaka</span>
        <span className="label" style={{ marginLeft: 10 }}>/ your hood, alive</span>
      </div>
      <div className="row gap-8">
        <span className="pill">◎ map</span>
        <span className="pill">☷ feed</span>
        <span className="pill">☼ today</span>
        <span className="pill pill-fill">＋ host event</span>
        <div className="circle" style={{ width: 30, height: 30, background: 'var(--mustard)' }}>A</div>
      </div>
    </div>

    <div className="box" style={{ padding: 18, background: 'var(--paper-warm)', position: 'relative' }}>
      <span className="label">VOL. IV · APR</span>
      <h1 style={{ fontSize: 72, marginTop: 4, lineHeight: 0.9 }}>
        more alive <em className="serif" style={{ color: 'var(--terra)' }}>than you think.</em>
      </h1>
      <div className="row" style={{ marginTop: 14, gap: 10 }}>
        <span className="btn btn-terra">explore map →</span>
        <span className="btn btn-out">tonight's list →</span>
      </div>
      <Note style={{ position: 'absolute', right: 20, top: 20, transform: 'rotate(4deg)', fontSize: 18 }}>
        hi Ambi <br />◡ pick something
      </Note>
    </div>

    <div className="row gap-16" style={{ marginTop: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 2 }}>
        <span className="label">PINNED ON THE WALL</span>
        <div className="row gap-12" style={{ flexWrap: 'wrap', marginTop: 10 }}>
          {[
            ['Kiln & chai', 'tonight · 6:30', 'Meera', 'tilt-l', 'terra'],
            ['Bookswap', 'wed · 5pm', 'Arjun', 'tilt-r', 'sage'],
            ['Open mic', 'fri · 8pm', 'Raghu', 'tilt-ll', 'terra'],
            ['Run club', 'sat · 6am', 'Jaya', 'tilt-rr', 'sage'],
          ].map(([t, m, h, tilt, tint]) => (
            <div key={t} style={{ width: 180 }}>
              <EventFlyer title={t} meta={m} host={h} tint={tint} tilt={tilt} pill="PINNED" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <span className="label">LIVE MAP</span>
        <div style={{ marginTop: 10 }}>
          <SketchMap height={220} pins={6} />
        </div>
        <Divider label="radius" />
        <div className="row gap-6">
          <span className="pill">2</span>
          <span className="pill pill-fill">5 km</span>
          <span className="pill">10</span>
          <span className="pill">20</span>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { HomeA, HomeB, HomeC, HomeDesktop });
