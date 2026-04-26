'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentButton({
  label,
  reason,
  amount,
  eventId,
  eventTitle
}: {
  label: string;
  reason: 'subscription' | 'hosting_fee' | 'promotion';
  amount: number;
  eventId?: string;
  eventTitle?: string;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.Razorpay) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);

  async function handlePay() {
    setError('');

    const res = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, eventId })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data?.orderId || !data?.keyId) {
      setError(data?.error ?? 'Unable to start payment');
      return;
    }

    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: 'INR',
      order_id: data.orderId,
      name: 'ILLAKA',
      description: label,
      handler: () => {
        window.location.reload();
      }
    });
    rzp.open();
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePay} disabled={!ready}>
        {label}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
