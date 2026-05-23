import type { MediaItem } from './content';

export type BusinessType = 'restaurant' | 'event_organizer';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BusinessHours = {
  day: DayOfWeek;
  open: string;
  close: string;
};

export type BusinessLocation = {
  address: string;
  lat: number;
  lng: number;
};

export type BusinessLinks = {
  instagram?: string;
  website?: string;
};

export type Business = {
  id: string;
  name: string;
  tagline?: string;
  type: BusinessType;
  logo: string;
  description: string;
  hours: BusinessHours[];
  location: BusinessLocation | null;
  locationGiven: boolean;
  isFollowing: boolean;
  links?: BusinessLinks;
  gallery: MediaItem[];
};

export type MenuCategory = {
  id: string;
  name: string;
  itemIds: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  image: string;
  categoryId: string;
  views: number;
  postedAt: number;
  featured?: boolean;
  isPromo?: boolean;
};

export type ProfileTabId = 'Menu' | 'Gallery' | 'Events' | 'About';
