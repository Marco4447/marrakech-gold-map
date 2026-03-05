/**
 * Shared domain types used across the app.
 */

export interface VibeProfile {
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  is_vip?: boolean;
}

export interface Vibe {
  id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  likes: number;
  super_vibes: number;
  username: string | null;
  user_id: string | null;
  created_at: string;
  media_type?: string;
  mood?: string | null;
  is_official?: boolean;
  profile?: VibeProfile | null;
}

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
  description: string | null;
  image_url: string | null;
  address: string | null;
  neighborhood: string | null;
  rating: number | null;
  is_partner: boolean;
  has_active_offer: boolean;
  vip_perk_description: string | null;
}

export interface VibePin {
  id: string;
  image_url: string;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  location: string | null;
  media_type?: string;
  is_official?: boolean;
}

export interface HotPlace {
  name: string;
  vibeCount: number;
  lastImage: string;
}

export interface RecentVibe {
  id: string;
  image_url: string;
  location: string | null;
  caption: string | null;
  mood: string | null;
  username: string | null;
  created_at: string;
  media_type: string;
  is_official: boolean;
  latitude: number | null;
  longitude: number | null;
}
