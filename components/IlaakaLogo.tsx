import React from 'react';

/** The noticeboard mark — golden corkboard with pinned slips and "i" card */
export function IlaakaMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Mustard / cork container */}
      <rect x="2" y="2" width="96" height="96" rx="16" ry="16"
        fill="#D4A73A" stroke="#3A2F23" strokeWidth="2.5" />

      {/* Terra/red slip — back layer, upper-left, rotated CCW */}
      <g transform="rotate(-11, 37, 30)">
        <rect x="8" y="10" width="58" height="42" rx="3"
          fill="#C85536" stroke="#3A2F23" strokeWidth="1.8" />
      </g>

      {/* Sage/green slip — back layer, lower area, rotated CW */}
      <g transform="rotate(9, 62, 68)">
        <rect x="36" y="52" width="54" height="36" rx="3"
          fill="#6C7D57" stroke="#3A2F23" strokeWidth="1.8" />
      </g>

      {/* Cream main card — front, slight tilt */}
      <g transform="rotate(1.5, 48, 50)">
        <rect x="17" y="23" width="62" height="52" rx="3"
          fill="#FFF6E4" stroke="#3A2F23" strokeWidth="2" />
        {/* Thumbtack pin */}
        <circle cx="63" cy="30" r="4.5" fill="#C85536" />
        {/* i letterform */}
        <text
          x="48"
          y="66"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          fontWeight={700}
          fontSize={30}
          fill="#3A2F23"
          textAnchor="middle"
        >i</text>
      </g>
    </svg>
  );
}

/** Horizontal lockup — mark + wordmark. Use in top nav. */
export function IlaakaLogoH({ markSize = 36 }: { markSize?: number }) {
  const fontSize = Math.round(markSize * 0.6);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(markSize * 0.22) }}>
      <IlaakaMark size={markSize} />
      <span
        style={{
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: 'var(--ink)',
        }}
      >
        ilaaka
      </span>
    </span>
  );
}

/** Stacked lockup — mark above wordmark + tagline. Use on auth / splash screens. */
export function IlaakaLogoStacked({ markSize = 80 }: { markSize?: number }) {
  const wordSize = Math.round(markSize * 0.475);
  const tagSize = Math.round(markSize * 0.175);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(markSize * 0.12) }}>
      <IlaakaMark size={markSize} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(markSize * 0.05) }}>
        <span
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: wordSize,
            letterSpacing: '-0.035em',
            lineHeight: 1,
            color: 'var(--ink)',
          }}
        >
          ilaaka<span style={{ color: '#C85536' }}>.</span>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            fontStyle: 'italic',
            fontSize: tagSize,
            color: '#C85536',
            letterSpacing: '0.01em',
          }}
        >
          ·what&apos;s on this week·
        </span>
      </div>
    </div>
  );
}
