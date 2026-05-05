export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  latitude: number | null;
  longitude: number | null;
  radiusPreference: number;
  subscriptionType: string | null;
};

export type UpdateProfileInput = {
  name?: string;
  radiusPreference?: number;
};

export type UpdateLocationInput = {
  latitude: number;
  longitude: number;
  radius?: number;
};

export type MemberSummary = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};
