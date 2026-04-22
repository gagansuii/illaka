'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { EventSummary } from '@/lib/types';
import { getEventTheme } from '@/lib/event-style';


function makeMarkerIcon(event: EventSummary, active: boolean) {
  const theme = getEventTheme(event);
  const content = event.badgeIcon
    ? `<img src="${event.badgeIcon}" alt="" onerror="this.remove()" />`
    : `<span class="map-marker-fallback">${theme.shortLabel.slice(0, 2)}</span>`;

  return L.divIcon({
    html: `<div class="map-marker ${active ? 'is-active' : ''}" style="--marker-accent:${theme.accent};--marker-strong:${theme.accentStrong};--marker-glow:${theme.markerGlow};">
      <span class="map-marker-pulse"></span>
      <span class="map-marker-core">${content}</span>
      <span class="map-marker-label">${theme.shortLabel}</span>
    </div>`,
    className: '',
    iconSize: [120, 54],
    iconAnchor: [24, 24]
  });
}

const userIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#f7efe4;border:4px solid #0f766e;box-shadow:0 0 0 6px rgba(15,118,110,0.18);"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function MapClickHandler({ onSelectLocation }: { onSelectLocation: (coords: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onSelectLocation([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

export function MapView({
  events,
  center,
  radius,
  previewedEventId,
  onPreviewEvent,
  onOpenEvent,
  onSelectLocation
}: {
  events: EventSummary[];
  center: [number, number];
  radius: number;
  previewedEventId?: string | null;
  onPreviewEvent?: (event: EventSummary) => void;
  onOpenEvent?: (event: EventSummary) => void;
  onSelectLocation?: (coords: [number, number]) => void;
}) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }, []);

  const defaultMarkerIcons = useMemo(() => {
    const iconMap = new Map<string, L.DivIcon>();
    for (const event of events) {
      iconMap.set(event.id, makeMarkerIcon(event, false));
    }
    return iconMap;
  }, [events]);

  const activeMarkerIcons = useMemo(() => {
    const iconMap = new Map<string, L.DivIcon>();
    for (const event of events) {
      iconMap.set(event.id, makeMarkerIcon(event, true));
    }
    return iconMap;
  }, [events]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <RecenterMap center={center} />
      {onSelectLocation ? <MapClickHandler onSelectLocation={onSelectLocation} /> : null}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {center ? (
        <>
          <Marker position={center} icon={userIcon} />
          <Circle center={center} radius={radius} pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.08, weight: 1.5 }} />
        </>
      ) : null}
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.latitude, event.longitude]}
          icon={event.id === previewedEventId ? activeMarkerIcons.get(event.id) : defaultMarkerIcons.get(event.id)}
          eventHandlers={{
            mouseover: () => onPreviewEvent?.(event),
            click: () => {
              onPreviewEvent?.(event);
              onOpenEvent?.(event);
            }
          }}
        />
      ))}
    </MapContainer>
  );
}
