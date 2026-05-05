export type EventRow = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  badgeIcon: string;
  latitude: number;
  longitude: number;
  startTime: Date | string;
  endTime: Date | string;
  visibility: 'PUBLIC' | 'PRIVATE';
  capacity: number;
  organizerId: string;
  isPaid: boolean;
  ticketPrice?: number | null;
  engagementScore: number;
  address?: string | null;
  eventType?: 'PHYSICAL' | 'ONLINE' | null;
  onlineLink?: string | null;
  linkShareMode?: 'IMMEDIATE' | 'BEFORE_EVENT' | null;
  paymentQrUrl?: string | null;
  shareToken?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type CreateEventInput = {
  title: string;
  description: string;
  bannerUrl: string;
  badgeIcon: string;
  latitude: number;
  longitude: number;
  startTime: Date;
  endTime: Date;
  visibility: 'PUBLIC' | 'PRIVATE';
  capacity: number;
  isPaid: boolean;
  ticketPrice?: number;
  paymentQrUrl?: string | null;
  address?: string | null;
  eventType: 'PHYSICAL' | 'ONLINE';
  onlineLink?: string | null;
  linkShareMode?: 'IMMEDIATE' | 'BEFORE_EVENT' | null;
  organizerId: string;
};

export type UpdateEventInput = {
  title?: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
};

export type NearbyEventsQuery = {
  lat: number;
  lng: number;
  radius: number;
};

export type EventForRsvp = {
  id: string;
  title: string;
  capacity: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  organizerId: string;
  isPaid: boolean;
  ticketPrice: number | null;
  startTime: Date | string;
  organizerName: string | null;
};

export type RsvpRecord = {
  id: string;
  ticketId: string;
};

export type OrganizerEventSummary = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  badgeIcon: string;
  startTime: string;
  endTime: string;
  visibility: string;
  capacity: number;
  isPaid: boolean;
  engagementScore: number;
  organizerId: string;
  latitude: number;
  longitude: number;
  rsvpCount: number;
};
