// Host event flow — quick mode + detailed mode

const HostQuick = () => (
  <Phone>
    <TopNav right="× close" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="serif" style={{ fontSize: 24, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
          Quick post
        </h2>
        <span className="pill pill-sage">● quick ○ detailed</span>
      </div>
      <span className="label">3 fields. done in 30 seconds.</span>

      <div className="col gap-14" style={{ marginTop: 14 }}>
        <div className="col gap-4">
          <span className="label-ink">1 · WHAT</span>
          <div className="box" style={{ padding: 10 }}>
            <span className="serif" style={{ fontSize: 18 }}>Chai + sunset rooftop</span>
          </div>
          <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
            {['☕ chai', '☼ sunset', '♪ music', '♨ food', '✎ skill'].map(t => (
              <span key={t} className="pill">{t}</span>
            ))}
          </div>
        </div>

        <div className="col gap-4">
          <span className="label-ink">2 · WHEN</span>
          <div className="row gap-6">
            <div className="pill pill-fill">tonight</div>
            <div className="pill">tomorrow</div>
            <div className="pill">wknd</div>
            <div className="pill">pick ⤵</div>
          </div>
          <div className="row gap-6" style={{ marginTop: 4 }}>
            {['5p','6p','7p','8p','9p'].map((t, i) => (
              <span key={t} className={`pill ${i === 2 ? 'pill-fill' : ''}`}>{t}</span>
            ))}
          </div>
        </div>

        <div className="col gap-4">
          <span className="label-ink">3 · WHERE</span>
          <div className="box" style={{ padding: 8 }}>
            <SketchMap height={100} pins={1} />
          </div>
          <span className="label">☍ pinned: rooftop, 12 heritage ln</span>
        </div>

        <div className="btn btn-terra" style={{ marginTop: 6 }}>post it ◉</div>
        <Note style={{ textAlign: 'center' }}>
          you can add pics after
        </Note>
      </div>
    </div>
    <BottomTab active="host" />
  </Phone>
);

const HostDetailed1 = () => (
  <Phone>
    <TopNav right="step 1/4" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      {/* progress */}
      <div className="row gap-6" style={{ marginTop: 6 }}>
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            flex: 1, height: 6,
            background: n === 1 ? 'var(--terra)' : 'var(--paper-deep)',
            border: '1.5px solid var(--ink)',
          }} />
        ))}
      </div>
      <span className="label" style={{ marginTop: 8, display: 'block' }}>STEP 1 · THE STORY</span>

      <h2 className="serif" style={{ fontSize: 26, marginTop: 6, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        What are you gathering folks for?
      </h2>

      <div className="col gap-10" style={{ marginTop: 14 }}>
        <div className="col gap-4">
          <span className="label-ink">TITLE</span>
          <div className="box" style={{ padding: 10 }}>
            <span className="serif" style={{ fontSize: 18 }}>Kiln & chai · heritage ser.</span>
          </div>
        </div>
        <div className="col gap-4">
          <span className="label-ink">THE VIBE · 1-2 LINES</span>
          <div className="box" style={{ padding: 10, minHeight: 80 }}>
            <Lines count={3} />
          </div>
        </div>
        <div className="col gap-4">
          <span className="label-ink">PICK A VIBE</span>
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['♨ craft', 'pottery · print · paint'],
              ['☕ hang', 'chai · chat · chill'],
              ['♪ sound', 'mic · jam · vinyl'],
              ['⇡ move', 'run · walk · yoga'],
            ].map(([l, s]) => (
              <div key={l} className="box" style={{ padding: 10 }}>
                <div className="serif" style={{ fontSize: 14 }}>{l}</div>
                <span className="label" style={{ fontSize: 8 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 16 }}>
        <div className="btn btn-out" style={{ flex: 1 }}>back</div>
        <div className="btn btn-terra" style={{ flex: 1.5 }}>next → place</div>
      </div>
    </div>
    <BottomTab active="host" />
  </Phone>
);

const HostDetailed2 = () => (
  <Phone>
    <TopNav right="step 2/4" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="row gap-6">
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            flex: 1, height: 6,
            background: n <= 2 ? 'var(--terra)' : 'var(--paper-deep)',
            border: '1.5px solid var(--ink)',
          }} />
        ))}
      </div>
      <span className="label" style={{ marginTop: 8, display: 'block' }}>STEP 2 · PLACE & TIME</span>
      <h2 className="serif" style={{ fontSize: 22, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Drop a pin, pick a day.
      </h2>

      <div className="col gap-4" style={{ marginTop: 12 }}>
        <span className="label-ink">DROP A PIN</span>
        <div style={{ position: 'relative' }}>
          <SketchMap height={180} pins={1} />
          <div className="pill pill-fill" style={{ position: 'absolute', top: 8, right: 8 }}>◉ use my loc</div>
        </div>
        <span className="label">42 heritage lane · S-02 warehouse</span>
      </div>

      <div className="col gap-4" style={{ marginTop: 14 }}>
        <span className="label-ink">WHEN</span>
        <div className="row gap-6">
          <div className="box" style={{ flex: 1, padding: 10 }}>
            <span className="label">DATE</span>
            <div className="serif" style={{ fontSize: 16 }}>oct 24, fri</div>
          </div>
          <div className="box" style={{ flex: 1, padding: 10 }}>
            <span className="label">START</span>
            <div className="serif" style={{ fontSize: 16 }}>5:30 pm</div>
          </div>
          <div className="box" style={{ flex: 1, padding: 10 }}>
            <span className="label">END</span>
            <div className="serif" style={{ fontSize: 16 }}>8:00 pm</div>
          </div>
        </div>
      </div>

      <div className="col gap-4" style={{ marginTop: 14 }}>
        <span className="label-ink">CAPACITY</span>
        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          <div className="box-fill" style={{ padding: '8px 14px' }}>−</div>
          <div className="serif" style={{ fontSize: 24 }}>12</div>
          <div className="box-fill" style={{ padding: '8px 14px' }}>+</div>
          <div className="row" style={{ flex: 1, height: 8, border: '1.5px solid var(--ink)', marginLeft: 10 }}>
            <div style={{ flex: 0.3, background: 'var(--terra)' }} />
          </div>
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 18 }}>
        <div className="btn btn-out" style={{ flex: 1 }}>← story</div>
        <div className="btn btn-terra" style={{ flex: 1.5 }}>next → look →</div>
      </div>
    </div>
    <BottomTab active="host" />
  </Phone>
);

const HostDetailed3 = () => (
  <Phone>
    <TopNav right="step 3/4" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="row gap-6">
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            flex: 1, height: 6,
            background: n <= 3 ? 'var(--terra)' : 'var(--paper-deep)',
            border: '1.5px solid var(--ink)',
          }} />
        ))}
      </div>
      <span className="label" style={{ marginTop: 8, display: 'block' }}>STEP 3 · THE LOOK</span>
      <h2 className="serif" style={{ fontSize: 22, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Give it a face.
      </h2>

      <div className="col gap-10" style={{ marginTop: 12 }}>
        <div className="box stroke-dash" style={{ padding: 14 }}>
          <div className="img-ph" style={{ height: 100, marginBottom: 8 }}>HERO BANNER</div>
          <span className="label">drag or tap · jpg/png · wide</span>
        </div>
        <div className="box stroke-dash" style={{ padding: 14 }}>
          <div className="row gap-8" style={{ alignItems: 'center' }}>
            <div className="img-ph" style={{ width: 60, height: 60 }}>ICON</div>
            <div className="col">
              <span className="serif" style={{ fontSize: 14 }}>badge icon</span>
              <span className="label">square · for map pins</span>
            </div>
          </div>
        </div>

        <span className="label-ink">OR PICK A FLYER TEMPLATE</span>
        <div className="row gap-8" style={{ overflowX: 'auto', paddingBottom: 6 }}>
          {['riso sun','newsprint','bazaar','kiln'].map((t, i) => (
            <div key={t} className={`box-fill ${i % 2 ? 'tilt-r' : 'tilt-l'}`} style={{ minWidth: 88, padding: 6, flexShrink: 0 }}>
              <div className={i === 0 ? 'img-terra' : i === 1 ? 'img-ph' : i === 2 ? 'img-sage' : 'img-terra'} style={{ height: 80 }} />
              <span className="label" style={{ marginTop: 4, fontSize: 8, display: 'block' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 18 }}>
        <div className="btn btn-out" style={{ flex: 1 }}>← place</div>
        <div className="btn btn-terra" style={{ flex: 1.5 }}>preview →</div>
      </div>
    </div>
    <BottomTab active="host" />
  </Phone>
);

const HostDetailed4 = () => (
  <Phone>
    <TopNav right="step 4/4" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="row gap-6">
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            flex: 1, height: 6,
            background: 'var(--terra)',
            border: '1.5px solid var(--ink)',
          }} />
        ))}
      </div>
      <span className="label" style={{ marginTop: 8, display: 'block' }}>STEP 4 · PREVIEW & PUBLISH</span>
      <h2 className="serif" style={{ fontSize: 22, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        How it'll look on the wall.
      </h2>

      <div style={{ marginTop: 14 }}>
        <EventFlyer title="Kiln & chai" meta="oct 24 · 5:30p · 460m" host="You" pill="NEW" tint="terra" tilt="tilt-l" />
      </div>

      <Divider label="visibility" />
      <div className="col gap-6">
        {[
          ['◉ public wall', 'anyone in 5 km'],
          ['☍ friends only', 'people you follow'],
          ['◐ invite link', 'only w/ link'],
        ].map(([l, s], i) => (
          <div key={l} className={`row box ${i === 0 ? 'box-terra' : ''}`} style={{ padding: 10, gap: 10, alignItems: 'center' }}>
            <span>{i === 0 ? '●' : '○'}</span>
            <div className="col">
              <span className="serif" style={{ fontSize: 14 }}>{l}</span>
              <span className="label">{s}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="btn btn-terra" style={{ marginTop: 18 }}>publish · pin to the map ◉</div>
      <Note style={{ textAlign: 'center', marginTop: 8 }}>
        you can edit later
      </Note>
    </div>
    <BottomTab active="host" />
  </Phone>
);

Object.assign(window, { HostQuick, HostDetailed1, HostDetailed2, HostDetailed3, HostDetailed4 });
