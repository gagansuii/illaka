'use client';

interface WispConfig {
  left: string;
  size: string;
  dur: string;
  delay: string;
  dx: string;
  drift: string;
  color: string;
  peak: string;
}

const WISPS: WispConfig[] = [
  { left: '4%',  size: '130px', dur: '6.4s', delay: '0s',   dx: '-10px', drift: '20px',  color: 'rgba(240,180,110,0.26)', peak: '0.54' },
  { left: '16%', size: '95px',  dur: '8.2s', delay: '1.2s', dx: '8px',   drift: '-14px', color: 'rgba(232,151,58,0.20)',  peak: '0.46' },
  { left: '28%', size: '165px', dur: '9.6s', delay: '0.5s', dx: '-6px',  drift: '26px',  color: 'rgba(244,196,100,0.24)', peak: '0.58' },
  { left: '40%', size: '110px', dur: '7.0s', delay: '2.0s', dx: '12px',  drift: '-10px', color: 'rgba(200,102,63,0.22)',  peak: '0.50' },
  { left: '52%', size: '145px', dur: '8.8s', delay: '0.8s', dx: '-18px', drift: '30px',  color: 'rgba(240,175,85,0.22)', peak: '0.52' },
  { left: '64%', size: '100px', dur: '7.4s', delay: '1.6s', dx: '10px',  drift: '-16px', color: 'rgba(228,142,52,0.18)', peak: '0.44' },
  { left: '76%', size: '125px', dur: '9.0s', delay: '0.3s', dx: '-8px',  drift: '14px',  color: 'rgba(244,200,120,0.24)', peak: '0.55' },
  { left: '88%', size: '85px',  dur: '6.8s', delay: '2.4s', dx: '6px',   drift: '-8px',  color: 'rgba(212,136,26,0.20)',  peak: '0.42' },
];

export function SmokeLayer() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height: '260px', zIndex: 5 }}
      aria-hidden="true"
    >
      {WISPS.map((wisp, i) => (
        <div
          key={i}
          className="smoke-wisp"
          style={
            {
              left: wisp.left,
              '--smoke-size': wisp.size,
              '--smoke-dur': wisp.dur,
              '--smoke-delay': wisp.delay,
              '--smoke-dx': wisp.dx,
              '--smoke-drift': wisp.drift,
              '--smoke-color': wisp.color,
              '--smoke-peak': wisp.peak,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
