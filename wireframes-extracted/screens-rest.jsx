// Profile, onboarding, neighborhood hub

const ProfileA = () => (
  <Phone>
    <TopNav right="☰" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      {/* id card */}
      <div className="box-fill tilt-l" style={{
        padding: 14, position: 'relative',
        boxShadow: '2px 2px 0 var(--ink)',
      }}>
        <span className="tape" style={{ top: -8, left: '40%', transform: 'rotate(3deg)' }} />
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <div className="img-terra" style={{ width: 64, height: 64 }}>ME</div>
          <div className="col" style={{ flex: 1 }}>
            <span className="serif" style={{ fontSize: 22 }}>Ambi</span>
            <span className="label">◉ lodi block · since jan</span>
            <div className="row gap-4" style={{ marginTop: 4 }}>
              <span className="stamp stamp-terra">HOST</span>
              <span className="stamp stamp-sage">REGULAR</span>
            </div>
          </div>
        </div>
        <p className="hand" style={{ fontSize: 16, marginTop: 10, color: 'var(--ink-soft)' }}>
          "slow walks, hot chai, bad film screenings."
        </p>
      </div>

      <Divider label="trust & badges" />
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <Badge icon="✦" label="verified" />
        <Badge icon="♨" label="kiln crew" />
        <Badge icon="☕" label="host 5×" />
        <Badge icon="☷" label="early bird" />
        <Badge icon="♪" label="open mic" earned={false} />
      </div>

      <Divider label="vibes" />
      <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
        {['slow', 'crafts', 'books', 'walks', 'film', 'biryani'].map(t => (
          <span key={t} className="pill">{t}</span>
        ))}
        <span className="pill pill-sage">+ add</span>
      </div>

      <Divider label="events · hosted / went" />
      <div className="row gap-8" style={{ overflowX: 'auto', paddingBottom: 6 }}>
        {['Kiln night', 'Bookswap', 'Run club', 'Chai pop-up'].map((t, i) => (
          <div key={t} className={`box-fill ${i % 2 ? 'tilt-r' : 'tilt-l'}`} style={{ minWidth: 110, padding: 6, flexShrink: 0 }}>
            <div className={i % 2 ? 'img-sage' : 'img-terra'} style={{ height: 60 }} />
            <span className="serif" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{t}</span>
            <span className="label">{i % 2 ? 'went' : 'hosted'}</span>
          </div>
        ))}
      </div>

      <Divider label="memory wall" />
      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`img-ph ${i % 2 ? 'img-terra' : i % 3 ? 'img-sage' : ''}`} style={{ aspectRatio: '1', height: 'auto' }}>
            {i === 0 ? 'JAN' : i === 1 ? 'FEB' : i === 2 ? 'MAR' : ''}
          </div>
        ))}
      </div>
    </div>
    <BottomTab active="me" />
  </Phone>
);

const ProfileB = () => (
  <Phone bg="var(--paper-deep)">
    <TopNav right="edit" />
    <div style={{ padding: 0, height: 'calc(100% - 44px)', overflowY: 'auto', paddingBottom: 70 }}>
      <div className="img-terra" style={{ height: 120, margin: 0, borderRadius: 0 }}>
        COVER · MY HOOD AT DUSK
      </div>
      <div style={{ padding: '0 16px', marginTop: -38 }}>
        <div className="circle" style={{
          width: 76, height: 76,
          background: 'var(--mustard)',
          borderWidth: 2, borderColor: 'var(--ink)',
          boxShadow: '2px 2px 0 var(--ink)',
          fontSize: 28,
        }}>A</div>
        <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 8 }}>
          <div className="col">
            <h2 className="serif" style={{ fontSize: 28, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>Ambi R.</h2>
            <span className="label">◉ lodi · joined jan · 47 events</span>
          </div>
          <div className="col" style={{ alignItems: 'flex-end' }}>
            <span className="serif" style={{ fontSize: 22, color: 'var(--terra)' }}>lvl 4</span>
            <span className="label">local · regular</span>
          </div>
        </div>

        {/* tabs */}
        <div className="row gap-8" style={{ marginTop: 14, borderBottom: '1.5px solid var(--ink)' }}>
          {['events', 'badges', 'wall', 'vibe'].map((t, i) => (
            <div key={t} style={{
              padding: '6px 10px',
              background: i === 0 ? 'var(--ink)' : 'transparent',
              color: i === 0 ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'Space Mono',
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em',
            }}>{t}</div>
          ))}
        </div>

        <div className="col gap-10" style={{ marginTop: 14 }}>
          {[
            ['HOSTED', 'Kiln & chai', 'oct 24 · 13 came', 'terra'],
            ['WENT', 'Bookswap', 'oct 18 · 8 others', 'sage'],
            ['HOSTED', 'Slow sunday', 'oct 13 · 22 came', 'terra'],
          ].map(([kind, n, m, c]) => (
            <div key={n} className="row box-fill" style={{ padding: 10, gap: 10 }}>
              <div className={c === 'terra' ? 'img-terra' : 'img-sage'} style={{ width: 54, height: 54 }} />
              <div className="col" style={{ flex: 1 }}>
                <span className={`stamp stamp-${c === 'terra' ? 'terra' : 'sage'}`} style={{ alignSelf: 'flex-start' }}>{kind}</span>
                <span className="serif" style={{ fontSize: 15, marginTop: 2 }}>{n}</span>
                <span className="label">{m}</span>
              </div>
            </div>
          ))}
        </div>

        <Divider label="badge shelf · 8/24" />
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          {['✦','♨','☕','☷','♪','⇡'].map((ic, i) => (
            <Badge key={i} icon={ic} label="" earned={i < 4} />
          ))}
        </div>
      </div>
    </div>
    <BottomTab active="me" />
  </Phone>
);

const ProfileC = () => (
  <Phone>
    <TopNav right="⚙" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      {/* scrapbook layout */}
      <h1 className="serif" style={{ fontSize: 32, fontFamily: 'Instrument Serif', fontStyle: 'italic', marginTop: 8 }}>
        Ambi's<br />scrapbook.
      </h1>

      <div style={{ position: 'relative', marginTop: 14, minHeight: 220 }}>
        <div className="box-fill tilt-l" style={{
          position: 'absolute', top: 0, left: 0, width: 120, padding: 8,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <div className="img-terra" style={{ height: 80 }}>ME</div>
          <span className="label" style={{ marginTop: 4, display: 'block' }}>hi, im ambi</span>
        </div>
        <div className="box-fill tilt-rr" style={{
          position: 'absolute', top: 20, right: 0, width: 140, padding: 10,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <span className="label">◉ LODI · JAN</span>
          <p className="hand" style={{ fontSize: 14, marginTop: 2, color: 'var(--ink-soft)' }}>
            walking distance only.
          </p>
          <div className="row gap-4" style={{ marginTop: 4 }}>
            <span className="stamp stamp-sage">REG.</span>
          </div>
        </div>
        <div className="box tilt-l" style={{
          position: 'absolute', top: 150, left: 20, width: 130, padding: 8,
        }}>
          <span className="label">47 EVENTS · 8 HOSTED</span>
          <div className="row gap-4" style={{ marginTop: 4 }}>
            {['✦','♨','☕','☷'].map((ic, i) => (
              <div key={i} className="circle" style={{ width: 22, height: 22, background: 'var(--mustard)', fontSize: 10 }}>{ic}</div>
            ))}
          </div>
        </div>
      </div>

      <Divider label="vibes i'm drawn to" />
      <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
        {['slow walks', 'hot chai', 'bad films', 'books', 'kiln', 'street food'].map((t, i) => (
          <span key={t} className={`pill ${i % 3 === 0 ? 'pill-terra' : ''}`}>{t}</span>
        ))}
      </div>

      <Divider label="things i've made happen" />
      <div className="col gap-8">
        {['Slow sunday', 'Kiln night', 'Chai pop-up'].map((t, i) => (
          <div key={t} className="row box" style={{ padding: 8, gap: 8, alignItems: 'center' }}>
            <div className={i % 2 ? 'img-sage' : 'img-terra'} style={{ width: 40, height: 40 }} />
            <div className="col" style={{ flex: 1 }}>
              <span className="serif" style={{ fontSize: 14 }}>{t}</span>
              <span className="label">{13 + i * 3} came · ★ 4.{7 + i}</span>
            </div>
            <span className="pill pill-terra">again?</span>
          </div>
        ))}
      </div>
    </div>
    <BottomTab active="me" />
  </Phone>
);

// ─── Onboarding ───

const Onboard1 = () => (
  <Phone>
    <div style={{ height: '100%', padding: '40px 22px 80px', display: 'flex', flexDirection: 'column' }}>
      <div className="row gap-6" style={{ alignItems: 'center' }}>
        <div className="circle" style={{ width: 26, height: 26, background: 'var(--terra)' }}>
          <span style={{ color: 'var(--paper)', fontSize: 11 }}>✦</span>
        </div>
        <span className="serif" style={{ fontSize: 20 }}>illaka</span>
      </div>

      <div style={{ marginTop: 30 }}>
        <span className="label">WELCOME</span>
        <h1 style={{ fontSize: 56, marginTop: 6, lineHeight: 0.9 }}>
          hey,<br /><em className="serif" style={{ color: 'var(--terra)' }}>neighbour.</em>
        </h1>
        <p className="serif" style={{ fontSize: 16, marginTop: 14, lineHeight: 1.4 }}>
          3 steps and you're in. no feed. no ads. just what's happening<br /> around your block.
        </p>
      </div>

      {/* flyer decoration */}
      <div style={{ flex: 1, position: 'relative', marginTop: 14 }}>
        <div className="box-fill tilt-l" style={{ position: 'absolute', top: 0, left: 0, width: 120, padding: 8 }}>
          <div className="img-terra" style={{ height: 70 }} />
          <span className="label" style={{ marginTop: 4, display: 'block' }}>TONITE · KILN</span>
        </div>
        <div className="box-fill tilt-rr" style={{ position: 'absolute', top: 20, right: 0, width: 130, padding: 8 }}>
          <div className="img-sage" style={{ height: 80 }} />
          <span className="label" style={{ marginTop: 4, display: 'block' }}>WEEKLY · RUN</span>
        </div>
        <div className="box-fill tilt-r" style={{ position: 'absolute', top: 140, left: 30, width: 140, padding: 8 }}>
          <div className="img-ph" style={{ height: 60 }}>POTLUCK</div>
          <span className="label" style={{ marginTop: 4, display: 'block' }}>SUN 12 · BYO</span>
        </div>
      </div>

      <div className="col gap-8" style={{ marginTop: 16 }}>
        <div className="btn btn-terra">continue w/ phone</div>
        <div className="btn btn-out">continue w/ email</div>
      </div>
      <span className="label" style={{ marginTop: 10, textAlign: 'center' }}>already in? log in</span>
    </div>
  </Phone>
);

const Onboard2 = () => (
  <Phone>
    <TopNav right="1/3" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <span className="label">STEP 1 · WHERE YOU LIVE</span>
      <h2 className="serif" style={{ fontSize: 28, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Which hood is home?
      </h2>
      <p className="mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-soft)' }}>
        we use this to show what's actually walkable.
      </p>

      <div style={{ marginTop: 14 }}>
        <SketchMap height={220} pins={1} />
      </div>

      <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <span className="pill pill-fill">◉ use my loc</span>
        <span className="pill">⌕ search</span>
        <span className="pill">drop pin</span>
      </div>

      <Divider label="radius · how far counts as home?" />
      <div className="row gap-6">
        {['1','2','5','10','20'].map((t, i) => (
          <div key={t} className={`box ${i === 2 ? 'box-terra' : ''}`} style={{ flex: 1, padding: 8, textAlign: 'center' }}>
            <span className="serif" style={{ fontSize: 18 }}>{t}</span>
            <span className="label" style={{ fontSize: 8, display: 'block' }}>km</span>
          </div>
        ))}
      </div>

      <div className="btn btn-terra" style={{ marginTop: 20 }}>next → what you're into</div>
    </div>
  </Phone>
);

const Onboard3 = () => (
  <Phone>
    <TopNav right="2/3" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <span className="label">STEP 2 · YOUR VIBE</span>
      <h2 className="serif" style={{ fontSize: 26, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        What gets you out the house?
      </h2>
      <p className="mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-soft)' }}>
        pick 3 or more · no wrong answers.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
        {[
          ['☕','chai'],['♨','craft'],['♪','music'],
          ['✎','skills'],['⇡','move'],['☷','books'],
          ['◐','film'],['✿','plants'],['⎈','food'],
        ].map(([ic, l], i) => (
          <div key={l} className={`box col ${[0,4,8].includes(i) ? 'box-terra' : ''}`} style={{ padding: 10, alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20 }}>{ic}</span>
            <span className="label-ink">{l}</span>
          </div>
        ))}
      </div>

      <Divider label="anything else?" />
      <div className="box" style={{ padding: 10 }}>
        <span className="label">ADD YOUR OWN · e.g. "urdu poetry"</span>
      </div>

      <div className="row gap-8" style={{ marginTop: 20 }}>
        <div className="btn btn-out" style={{ flex: 1 }}>← back</div>
        <div className="btn btn-terra" style={{ flex: 1.5 }}>next → your face</div>
      </div>
    </div>
  </Phone>
);

const Onboard4 = () => (
  <Phone>
    <TopNav right="3/3" />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <span className="label">STEP 3 · HOW THEY'LL KNOW YOU</span>
      <h2 className="serif" style={{ fontSize: 26, marginTop: 4, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
        Just a name and a face.
      </h2>

      <div className="col" style={{ alignItems: 'center', marginTop: 22 }}>
        <div className="circle" style={{
          width: 100, height: 100,
          background: 'var(--paper-warm)',
          borderWidth: 1.5, borderStyle: 'dashed',
          fontSize: 28, color: 'var(--ink-soft)',
        }}>+</div>
        <span className="label" style={{ marginTop: 8 }}>TAP · PIC OR EMOJI</span>
      </div>

      <div className="col gap-10" style={{ marginTop: 24 }}>
        <div className="col gap-4">
          <span className="label-ink">FIRST NAME</span>
          <div className="box" style={{ padding: 10 }}>
            <span className="serif" style={{ fontSize: 18 }}>Ambi</span>
          </div>
        </div>
        <div className="col gap-4">
          <span className="label-ink">ONE LINE ABOUT YOU · optional</span>
          <div className="box" style={{ padding: 10 }}>
            <span className="hand" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>slow walks, hot chai, bad films</span>
          </div>
        </div>
      </div>

      <div className="btn btn-terra" style={{ marginTop: 22 }}>I'm in · open the wall →</div>
      <Note style={{ textAlign: 'center', marginTop: 10 }}>
        no feed. no ads. just yr hood.
      </Note>
    </div>
  </Phone>
);

// ─── Neighborhood hub ───

const HoodA = () => (
  <Phone>
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div className="col">
          <span className="label">your hood · 2 km</span>
          <h2 className="serif" style={{ fontSize: 26, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>Lodi block</h2>
        </div>
        <div className="col" style={{ alignItems: 'flex-end' }}>
          <span className="serif" style={{ fontSize: 22, color: 'var(--terra)' }}>218</span>
          <span className="label">neighbours</span>
        </div>
      </div>

      <Divider label="today's pulse" />
      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="box tint-terra" style={{ padding: 10 }}>
          <span className="serif" style={{ fontSize: 20 }}>7</span>
          <span className="label" style={{ display: 'block' }}>events today</span>
        </div>
        <div className="box tint-sage" style={{ padding: 10 }}>
          <span className="serif" style={{ fontSize: 20 }}>12</span>
          <span className="label" style={{ display: 'block' }}>new this week</span>
        </div>
        <div className="box tint-mustard" style={{ padding: 10 }}>
          <span className="serif" style={{ fontSize: 20 }}>3</span>
          <span className="label" style={{ display: 'block' }}>new neighbours</span>
        </div>
        <div className="box tint-sky" style={{ padding: 10 }}>
          <span className="serif" style={{ fontSize: 20 }}>◎</span>
          <span className="label" style={{ display: 'block' }}>map view</span>
        </div>
      </div>

      <Divider label="regulars · you'll see them around" />
      <div className="row gap-6" style={{ overflowX: 'auto', paddingBottom: 6 }}>
        {['M','A','R','E','J','K','P','S'].map((l, i) => (
          <div key={i} className="col" style={{ alignItems: 'center', gap: 4, minWidth: 48 }}>
            <div className="circle" style={{
              width: 44, height: 44,
              background: ['var(--mustard)','var(--terra-soft)','var(--sage)','var(--sky)'][i % 4],
              fontSize: 16,
            }}>{l}</div>
            <span className="label" style={{ fontSize: 8 }}>regular</span>
          </div>
        ))}
      </div>

      <Divider label="spots locals love" />
      <div className="col gap-8">
        {[
          ['Old kiln district', 'craft · heritage · 7 events here'],
          ['INA market', 'food · mornings · bazaar energy'],
          ['Lodi gardens', 'walk · picnic · run club meets'],
        ].map(([n, s], i) => (
          <div key={n} className="row box-fill" style={{ padding: 10, gap: 10 }}>
            <div className={i === 0 ? 'img-terra' : i === 1 ? 'img-sage' : 'img-ph'} style={{ width: 54, height: 54 }} />
            <div className="col" style={{ flex: 1 }}>
              <span className="serif" style={{ fontSize: 15 }}>{n}</span>
              <span className="label">{s}</span>
            </div>
            <span className="pill">→</span>
          </div>
        ))}
      </div>
    </div>
    <BottomTab active="hood" />
  </Phone>
);

const HoodB = () => (
  <Phone bg="var(--paper-deep)">
    <TopNav />
    <div style={{ padding: '4px 16px 70px', height: 'calc(100% - 44px)', overflowY: 'auto' }}>
      <h1 style={{ fontSize: 42, marginTop: 6 }}>
        Lodi <em className="serif" style={{ color: 'var(--terra)' }}>block.</em>
      </h1>
      <span className="label">the noticeboard · 218 locals</span>

      {/* bulletin wall */}
      <div style={{ position: 'relative', marginTop: 16, minHeight: 480 }}>
        <div className="box-fill tilt-ll" style={{
          position: 'absolute', top: 0, left: 0, width: 140, padding: 10,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <span className="stamp stamp-terra">ASK</span>
          <p className="hand" style={{ fontSize: 16, marginTop: 6, color: 'var(--ink-soft)' }}>
            anyone have a spare kiln brick?
          </p>
          <span className="label" style={{ marginTop: 6, display: 'block' }}>meera · 2h</span>
        </div>
        <div className="box-fill tilt-rr" style={{
          position: 'absolute', top: 20, right: 0, width: 140, padding: 10,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <span className="stamp stamp-sage">OFFER</span>
          <p className="hand" style={{ fontSize: 16, marginTop: 6, color: 'var(--ink-soft)' }}>
            4 tomato saplings, free to a home.
          </p>
          <span className="label" style={{ marginTop: 6, display: 'block' }}>kabir · 6h</span>
        </div>
        <div className="box-fill tilt-r" style={{
          position: 'absolute', top: 180, left: 10, width: 150, padding: 10,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <span className="stamp stamp-fill">EVENT</span>
          <div className="img-terra" style={{ height: 60, marginTop: 6 }} />
          <span className="serif" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>Kiln & chai</span>
          <span className="label">tonight · 6:30</span>
        </div>
        <div className="box-fill tilt-l" style={{
          position: 'absolute', top: 200, right: 20, width: 130, padding: 10,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <span className="stamp">LOST</span>
          <p className="hand" style={{ fontSize: 14, marginTop: 6, color: 'var(--ink-soft)' }}>
            grey cat near gate 4?
          </p>
          <span className="label" style={{ marginTop: 6, display: 'block' }}>raghu · 1d</span>
        </div>
        <div className="box-fill tilt-ll" style={{
          position: 'absolute', top: 360, left: 40, width: 160, padding: 10,
          boxShadow: '2px 2px 0 var(--ink)',
        }}>
          <span className="stamp stamp-terra">WELCOME</span>
          <p className="hand" style={{ fontSize: 14, marginTop: 6, color: 'var(--ink-soft)' }}>
            3 new faces this week — say hi.
          </p>
          <div className="row gap-4" style={{ marginTop: 6 }}>
            {['N','T','P'].map(l => (
              <div key={l} className="circle" style={{ width: 22, height: 22, background: 'var(--mustard)', fontSize: 10 }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="btn btn-terra" style={{ marginTop: 14 }}>＋ pin something</div>
    </div>
    <BottomTab active="hood" />
  </Phone>
);

Object.assign(window, { ProfileA, ProfileB, ProfileC, Onboard1, Onboard2, Onboard3, Onboard4, HoodA, HoodB });
