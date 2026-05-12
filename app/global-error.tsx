'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
    reportError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: 'linear-gradient(180deg, #f5ede2 0%, #eadfce 100%)',
          color: '#17120e',
        }}
      >
        <div
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            height: '4rem',
            width: '4rem',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            border: '1px solid rgba(83,56,39,0.12)',
            background: 'rgba(255,249,241,0.72)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c8663f"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(1.6rem, 4vw, 2.25rem)',
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          Something went seriously wrong.
        </h1>

        <p
          style={{
            marginTop: '1rem',
            maxWidth: '28rem',
            fontSize: '1rem',
            lineHeight: 1.75,
            color: 'rgba(23,18,14,0.80)',
          }}
        >
          An unexpected error occurred. Try again or go back to safety.
        </p>

        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              display: 'inline-flex',
              height: '3rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: '#c8663f',
              border: 'none',
              padding: '0 1.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              height: '3rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              border: '1px solid rgba(83,56,39,0.12)',
              background: 'rgba(255,249,241,0.72)',
              padding: '0 1.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#17120e',
              textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
