import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST ?? 'https://app.posthog.com';
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host,
      flushAt: 20,
      flushInterval: 10_000,
    });
  }
  return client;
}

type EventProps = Record<string, string | number | boolean | null | undefined>;

export const analytics = {
  capture(distinctId: string, event: string, properties?: EventProps): void {
    const ph = getClient();
    if (!ph) return;
    ph.capture({ distinctId, event, properties: { platform: 'server', ...properties } });
  },

  // Named helpers — keeps call sites consistent and prevents typos
  userSignedUp(userId: string, props?: EventProps) {
    this.capture(userId, 'user_signed_up', props);
  },
  eventCreated(userId: string, props?: EventProps) {
    this.capture(userId, 'event_created', props);
  },
  rsvpCreated(userId: string, props?: EventProps) {
    this.capture(userId, 'rsvp_created', props);
  },
  paymentInitiated(userId: string, props?: EventProps) {
    this.capture(userId, 'payment_initiated', props);
  },
};
