'use client';

import { useEffect, useState } from 'react';

export type GeoStatus = 'pending' | 'resolved' | 'ip-fallback' | 'unavailable';

export type UseGeolocationResult = {
  center: [number, number] | null;
  status: GeoStatus;
};

export function useGeolocation(): UseGeolocationResult {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<GeoStatus>('pending');

  useEffect(() => {
    const resolveFallback = async () => {
      try {
        const res = await fetch('/api/geo/ip');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            setCenter([data.latitude, data.longitude]);
            setStatus('ip-fallback');
            return;
          }
        }
      } catch {
        // IP geolocation is best-effort.
      }
      setStatus('unavailable');
    };

    if (!('geolocation' in navigator)) {
      void resolveFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setStatus('resolved');
      },
      () => void resolveFallback(),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  return { center, status };
}
