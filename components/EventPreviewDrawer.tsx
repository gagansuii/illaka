'use client';

import Link from 'next/link';
import { CalendarClock, MapPin, Sparkles, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ResilientImage } from '@/components/ResilientImage';

import type { EventSummary } from '@/lib/types';
import { formatEventDay, formatEventRange, getEventTheme } from '@/lib/event-style';

const metricPillClasses = 'info-pill px-3 py-1.5 text-xs';
const surfaceCardClasses =
  'rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.52)] p-4 dark:bg-[rgba(15,23,42,0.26)]';

export function EventPreviewDrawer({
  event,
  open,
  onOpenChange
}: {
  event: EventSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event) return null;

  const theme = getEventTheme(event);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-x-hidden p-0">
        {/* sr-only keeps these in the accessibility tree without affecting the visual layout. */}
        <DialogTitle className="sr-only">{event.title}</DialogTitle>
        <DialogDescription className="sr-only">{`Quick preview drawer for ${event.title}.`}</DialogDescription>

        <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,var(--surface-strong)_68%)] px-5 pb-4 pt-3 backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.58)_0%,var(--surface-strong)_68%)]">
          {/* Drag affordance for mobile bottom-sheet behavior. */}
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[rgba(71,85,105,0.24)] md:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold leading-tight tracking-[-0.01em] text-[var(--text)]">
                {event.title}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                Event Preview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: theme.accentStrong }}>
                {theme.label}
              </p>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full p-0 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
                  aria-label="Close event drawer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>

        <div className="space-y-7 px-5 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6">
          <div className="relative overflow-hidden rounded-[1.85rem] border border-[var(--line)] shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
            {event.bannerUrl ? (
              <ResilientImage
                src={event.bannerUrl}
                alt={event.title}
                className="h-56 w-full object-cover"
                fallback={
                  <div
                    className="flex h-56 w-full items-center justify-center text-5xl font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
                  >
                    {event.title.charAt(0)}
                  </div>
                }
              />
            ) : (
              <div
                className="flex h-56 w-full items-center justify-center text-5xl font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${theme.accentStrong} 0%, ${theme.accent} 100%)` }}
              >
                {event.title.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_10%,rgba(15,23,42,0.68)_68%,rgba(15,23,42,0.8)_100%)]" />
            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
              <span className="rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-800">
                {formatEventDay(event.startTime)}
              </span>
              {event.isPaid ? (
                <span className="rounded-full bg-[rgba(255,236,188,0.95)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                  Paid
                </span>
              ) : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/72">{theme.previewLine}</p>
              <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">{event.title}</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <span className={metricPillClasses}>
              <CalendarClock className="h-3.5 w-3.5" style={{ color: theme.accent }} />
              {formatEventRange(event.startTime, event.endTime)}
            </span>
            <span className={metricPillClasses}>
              <Users className="h-3.5 w-3.5" style={{ color: theme.accent }} />
              Cap {event.capacity}
            </span>
            <span className={metricPillClasses}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: theme.accent }} />
              Score {event.engagementScore}
            </span>
          </div>

          <section className="space-y-4">
            <p className="text-[15px] leading-7 text-muted">{event.description}</p>
            <div className={`${surfaceCardClasses} space-y-2`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentStrong }}>
                What this feels like
              </p>
              <ul className="space-y-2 text-sm leading-6 text-muted">
                {theme.storyBeats.map((beat) => (
                  <li key={beat} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span>{beat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <Button asChild size="lg">
              <Link href={`/events/${event.id}`}>Open full event</Link>
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Keep exploring
            </Button>
          </div>

          <div
            className={`${surfaceCardClasses} bg-[linear-gradient(160deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.42)_100%)] dark:bg-[linear-gradient(160deg,rgba(15,23,42,0.34)_0%,rgba(15,23,42,0.24)_100%)]`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" style={{ color: theme.accent }} />
              Nearby and easy to remember
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use the map as your anchor, then come back here when a marker or card catches your attention.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
