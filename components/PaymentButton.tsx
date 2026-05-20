'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay: new (opts: RazorpayOptions) => { open(): void };
  }
}

type ScriptState = 'loading' | 'ready' | 'error';

export function PaymentButton({
  label,
  reason,
  amount,
  eventId,
  onSuccess,
}: {
  label: string;
  reason: 'subscription' | 'hosting_fee' | 'promotion';
  amount: number;
  eventId?: string;
  onSuccess?: () => void;
}) {
  const [scriptState, setScriptState] = useState<ScriptState>('loading');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (typeof window.Razorpay === 'function') {
      setScriptState('ready');
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener('load', () => setScriptState('ready'));
      existing.addEventListener('error', () => setScriptState('error'));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptState('ready');
    script.onerror = () => setScriptState('error');
    document.body.appendChild(script);
    scriptRef.current = script;
    return () => { scriptRef.current = null; };
  }, []);

  const handlePay = useCallback(async () => {
    if (scriptState !== 'ready') return;
    if (typeof window.Razorpay !== 'function') {
      setError('Payment system unavailable. Please disable ad-blockers and retry.');
      return;
    }

    setError('');
    setPaying(true);

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, eventId }),
      });

      let data: Record<string, unknown> | null = null;
      try { data = await res.json(); } catch { /* json parse failed */ }

      if (!res.ok || !data?.orderId || !data?.keyId) {
        setError((data?.error as string) ?? 'Unable to start payment. Please try again.');
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: data!.keyId as string,
          amount: data!.amount as number,
          currency: 'INR',
          order_id: data!.orderId as string,
          name: 'ILAKA',
          description: label,
          handler: () => {
            resolve();
          },
          modal: {
            ondismiss: () => reject(new Error('dismissed')),
          },
        });
        rzp.open();
      });

      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'dismissed') {
        setError('Payment could not be completed. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  }, [scriptState, reason, eventId, label, onSuccess]);

  if (scriptState === 'error') {
    return (
      <p className="text-sm text-red-500">
        Payment system failed to load. Disable ad-blockers or try a different browser.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePay}
        disabled={scriptState !== 'ready' || paying}
        aria-busy={paying}
      >
        {paying ? 'Processing…' : label}
      </Button>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
