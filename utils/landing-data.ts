export type LandingEventCard = {
  title: string;
  label: string;
  description: string;
  time: string;
  accent: string;
};

export type CommunityTrack = {
  title: string;
  description: string;
  accent: string;
};

export const demoEvents: LandingEventCard[] = [
  {
    title: 'Morning Run Club',
    label: 'Running',
    description: 'A social sunrise loop with people who live just a few lanes away.',
    time: '6:30 AM',
    accent: '#64856d'
  },
  {
    title: 'Street Food Walk',
    label: 'Community',
    description: 'A guided tasting route through vendors you pass every day but rarely stop for.',
    time: '7:00 PM',
    accent: '#8f6f58'
  },
  {
    title: 'Terrace Painting Workshop',
    label: 'Arts',
    description: 'Open-air sketching with music, chai, and a patient local host.',
    time: '5:00 PM',
    accent: '#b86f4f'
  },
  {
    title: 'Night Campfire Stories',
    label: 'Wellness',
    description: 'A slower evening gathering built around conversation and gentle pause.',
    time: '8:00 PM',
    accent: '#6a887b'
  }
];

export const communityTracks: CommunityTrack[] = [
  {
    title: 'Guitar on the terrace',
    description: 'Local teachers turning ordinary buildings into after-hours classrooms.',
    accent: '#c8663f'
  },
  {
    title: 'Painting in the lane',
    description: 'Creative energy that makes the neighborhood feel softer and more alive.',
    accent: '#b86f4f'
  },
  {
    title: 'Yoga in the park',
    description: 'Wellness happening in public, familiar places instead of distant studios.',
    accent: '#6a887b'
  },
  {
    title: 'Coding over coffee',
    description: 'Skillshare sessions run by people who already live in your social radius.',
    accent: '#5e7f96'
  }
];
