import { FEED_ITEMS } from './mockFeed';
import type {
  Business,
  BusinessHours,
  DayOfWeek,
  MenuCategory,
  MenuItem,
  ProfileTabId,
} from '@/types/business';
import type { MediaItem } from '@/types/content';

const fullWeek = (open: string, close: string): BusinessHours[] =>
  Array.from({ length: 7 }, (_, i) => ({
    day: i as DayOfWeek,
    open,
    close,
  }));

const galleryFromUrls = (urls: string[]): MediaItem[] =>
  urls.map((uri) => ({
    uri,
    type: 'image' as const,
    width: 1080,
    height: 1080,
    aspect: 'square' as const,
  }));

const LA_PARADA_GALLERY = galleryFromUrls([
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
  'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
]);

const KEINEMUSIK_GALLERY = galleryFromUrls([
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
  'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80',
]);

export const BUSINESSES: Business[] = [
  {
    id: 'la-parada',
    name: 'La Parada',
    tagline: 'Bar de Tapas',
    type: 'restaurant',
    logo: 'https://i.pravatar.cc/160?u=la-parada',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
    hours: fullWeek('08:00', '21:00'),
    location: null,
    locationGiven: false,
    isFollowing: false,
    links: { instagram: 'laparada' },
    gallery: LA_PARADA_GALLERY,
  },
  {
    id: 'keinemusik-co',
    name: 'Keinemusik',
    tagline: 'Music collective & event organizer',
    type: 'event_organizer',
    logo: 'https://i.pravatar.cc/160?u=keinemusik',
    description:
      'Berlin-based music collective bringing world-class deep house and afro electronic events to cities across the globe.',
    hours: fullWeek('10:00', '22:00'),
    location: {
      address: 'Berlin, Germany',
      lat: 52.52,
      lng: 13.405,
    },
    locationGiven: true,
    isFollowing: false,
    links: { instagram: 'keinemusik', website: 'keinemusik.com' },
    gallery: KEINEMUSIK_GALLERY,
  },
];

export const MENU_CATEGORIES: Record<string, MenuCategory[]> = {
  'la-parada': [
    {
      id: 'tapas',
      name: 'Tapas',
      itemIds: ['lp-1', 'lp-2', 'lp-3'],
    },
    {
      id: 'mains',
      name: 'Mains',
      itemIds: ['lp-4', 'lp-5'],
    },
    {
      id: 'drinks',
      name: 'Drinks',
      itemIds: ['lp-6'],
    },
  ],
};

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'lp-1',
    name: 'Patatas Bravas',
    price: 65,
    currency: 'R',
    description:
      'Crispy potatoes tossed in our house brava sauce with garlic aioli.',
    image:
      'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=900&q=80',
    categoryId: 'tapas',
    views: 234,
    postedAt: NOW - 4 * HOUR,
    featured: true,
  },
  {
    id: 'lp-2',
    name: 'Gambas al Ajillo',
    price: 95,
    currency: 'R',
    description: 'Sizzling garlic prawns in olive oil with chili and parsley.',
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80',
    categoryId: 'tapas',
    views: 152,
    postedAt: NOW - 1 * DAY,
    isPromo: true,
  },
  {
    id: 'lp-3',
    name: 'Croquetas de Jamón',
    price: 75,
    currency: 'R',
    description: 'Creamy ham croquettes with smoked paprika dust.',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80',
    categoryId: 'tapas',
    views: 88,
    postedAt: NOW - 2 * DAY,
  },
  {
    id: 'lp-4',
    name: 'Paella Valenciana',
    price: 220,
    currency: 'R',
    description:
      'Traditional Valencian paella with chicken, rabbit, beans and saffron.',
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
    categoryId: 'mains',
    views: 410,
    postedAt: NOW - 3 * DAY,
  },
  {
    id: 'lp-5',
    name: 'Solomillo al Whisky',
    price: 195,
    currency: 'R',
    description: 'Pork tenderloin in a whisky and garlic reduction.',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80',
    categoryId: 'mains',
    views: 67,
    postedAt: NOW - 5 * DAY,
  },
  {
    id: 'lp-6',
    name: 'Sangria de la Casa',
    price: 85,
    currency: 'R',
    description: 'House red sangria with seasonal fruit and a cinnamon kiss.',
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=900&q=80',
    categoryId: 'drinks',
    views: 198,
    postedAt: NOW - 6 * DAY,
  },
];

export function getBusinessById(id: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}

export function getMenuCategoriesForBusiness(
  businessId: string,
): MenuCategory[] {
  return MENU_CATEGORIES[businessId] ?? [];
}

export function getMenuItemsForBusiness(businessId: string): MenuItem[] {
  const cats = getMenuCategoriesForBusiness(businessId);
  const allowedCatIds = new Set(cats.map((c) => c.id));
  return MENU_ITEMS.filter((i) => allowedCatIds.has(i.categoryId));
}

export function getMenuItemsForCategory(
  businessId: string,
  categoryId: string,
): MenuItem[] {
  const cat = getMenuCategoriesForBusiness(businessId).find(
    (c) => c.id === categoryId,
  );
  if (!cat) return [];
  const map = new Map(MENU_ITEMS.map((i) => [i.id, i] as const));
  return cat.itemIds
    .map((id) => map.get(id))
    .filter((i): i is MenuItem => Boolean(i));
}

export function getEventsForBusiness(businessId: string) {
  return FEED_ITEMS.filter(
    (item) => item.businessId === businessId && item.contentType === 'event',
  );
}

export function getTabsForBusiness(business: Business): ProfileTabId[] {
  const hasMenu = getMenuCategoriesForBusiness(business.id).length > 0;
  const hasEvents = getEventsForBusiness(business.id).length > 0;

  if (business.type === 'restaurant') {
    const tabs: ProfileTabId[] = [];
    if (hasMenu) tabs.push('Menu');
    tabs.push('Gallery');
    if (hasEvents) tabs.push('Events');
    tabs.push('About');
    return tabs;
  }

  return ['Events', 'Gallery', 'About'];
}
