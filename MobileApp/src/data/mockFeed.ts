import { ContentItem, DiscoverCategory, SearchHistoryEntry } from '@/types/content';

export const FEED_ITEMS: ContentItem[] = [
  {
    id: '1',
    contentType: 'event',
    title: 'Jerk x Jollof Accra',
    subtitle: 'Deep house event',
    description:
      'The ultimate Afro-Caribbean food and music experience. Hosted by Kojo Manuel with Front & Back, Wild Turkey, and Ghetto Golf.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1350,
        aspect: 'portrait',
      },
      {
        uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1080,
        aspect: 'square',
      },
      {
        uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 566,
        aspect: 'landscape',
      },
    ],
    badge: { label: 'UPCOMING EVENT', color: '#E91E63' },
    status: 'upcoming',
    verified: true,
    profileName: 'JERKXJOLLOF ACCRA',
    profileAvatar: 'https://i.pravatar.cc/80?u=jxj',
    categories: ['Events', 'Food & Drink'],
    chyron: 'Three of the hottest new places & events in your city',
  },
  {
    id: '2',
    contentType: 'place',
    title: 'SBCLTR',
    subtitle: 'Bar & Lounge',
    description:
      'A subculture-inspired cocktail bar in the heart of Cape Town. Craft cocktails, vinyl nights, and curated small plates.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1080,
        aspect: 'square',
      },
    ],
    badge: { label: 'NEW PLACE', color: '#00BFA5' },
    status: 'open',
    verified: true,
    profileName: 'SBCLTR',
    profileAvatar: 'https://i.pravatar.cc/80?u=sbcltr',
    categories: ['Bars', 'Night clubs'],
  },
  {
    id: '3',
    contentType: 'event',
    title: 'Keinemusik Cape Town',
    subtitle: 'Live performance',
    description:
      'Keinemusik crew is coming to Cape Town & JHB this Nov! Limited tickets available for an unforgettable night of house music.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 566,
        aspect: 'landscape',
      },
      {
        uri: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1350,
        aspect: 'portrait',
      },
    ],
    badge: { label: 'NEW EVENT', color: '#00BFA5' },
    status: 'upcoming',
    verified: false,
    profileName: 'Uncle Waffles',
    profileAvatar: 'https://i.pravatar.cc/80?u=uw',
    categories: ['Events', 'Music'],
    chyron: 'Keinemusik crew is coming to Cape Town & JHB this Nov!',
  },
  {
    id: '4',
    contentType: 'product',
    title: 'Summer Collection Drop',
    subtitle: 'Streetwear',
    description:
      'Limited-edition capsule collection featuring bold prints and relaxed fits. Available for pre-order exclusively on AUX.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1920,
        aspect: 'story',
      },
    ],
    badge: { label: 'PRE-ORDER', color: '#FF6F00' },
    verified: true,
    profileName: 'Himatsu Studio',
    profileAvatar: 'https://i.pravatar.cc/80?u=himatsu',
    categories: ['Products', 'Fashion'],
  },
  {
    id: '5',
    contentType: 'place',
    title: 'The Lawns',
    subtitle: 'Restaurant & Garden',
    description:
      'An open-air dining destination perfect for sundowners and weekend brunches. Farm-to-table menu with seasonal specials.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1350,
        aspect: 'portrait',
      },
      {
        uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1080,
        aspect: 'square',
      },
      {
        uri: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 566,
        aspect: 'landscape',
      },
      {
        uri: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1350,
        aspect: 'portrait',
      },
    ],
    status: 'open',
    verified: true,
    profileName: 'The Lawns',
    profileAvatar: 'https://i.pravatar.cc/80?u=lawns',
    categories: ['Restaurants', 'Sundowners'],
  },
  {
    id: '6',
    contentType: 'post',
    title: 'Weekend vibes at Shimmy Beach',
    subtitle: 'Beach club highlights',
    description:
      'Catch the sunset with live DJs every Friday and Saturday. Cabanas, frozen cocktails, and good energy all weekend long.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
        type: 'video',
        width: 600,
        height: 750,
      },
    ],
    badge: { label: 'FEATURED', color: '#7C4DFF' },
    status: 'open',
    verified: true,
    profileName: 'Shimmy Beach Club',
    profileAvatar: 'https://i.pravatar.cc/80?u=shimmy',
    categories: ['Beach bars', 'Events'],
  },
  {
    id: '7',
    contentType: 'place',
    title: 'Orphanage Cocktail Emporium',
    subtitle: 'Speakeasy',
    description:
      'Hidden behind an unmarked door in the city centre. Award-winning mixologists, dim lighting, and jazz on vinyl.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1080,
        aspect: 'square',
      },
      {
        uri: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 1350,
        aspect: 'portrait',
      },
    ],
    status: 'closed',
    verified: true,
    profileName: 'Orphanage CPT',
    profileAvatar: 'https://i.pravatar.cc/80?u=orphanage',
    categories: ['Bars', 'Romantic'],
  },
  {
    id: '8',
    contentType: 'event',
    title: 'Afropunk Joburg 2026',
    subtitle: 'Music & Art Festival',
    description:
      'Three days of music, art, fashion, and film celebrating the African creative diaspora. Early bird tickets selling fast.',
    media: [
      {
        uri: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1080&q=80',
        type: 'image',
        width: 1080,
        height: 566,
        aspect: 'landscape',
      },
    ],
    badge: { label: 'EARLY BIRD', color: '#E91E63' },
    status: 'upcoming',
    verified: true,
    profileName: 'Afropunk',
    profileAvatar: 'https://i.pravatar.cc/80?u=afropunk',
    categories: ['Events', 'Music'],
    chyron: 'Afropunk returns to Johannesburg for the biggest edition yet',
  },
];

export const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  { id: 'beach-bars', label: 'Beach bars', color: '#C62828', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
  { id: 'cost-effective', label: 'Cost-effective', color: '#2E7D32', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' },
  { id: 'sundowners', label: 'Sundowners', color: '#E65100', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80' },
  { id: 'cafes', label: 'Cafes', color: '#AD1457', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80' },
  { id: 'romantic', label: 'Romantic', color: '#4E342E', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80' },
  { id: 'night-clubs', label: 'Night clubs', color: '#1565C0', image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=80' },
  { id: 'wine-bars', label: 'Wine bars', color: '#6A1B9A', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80' },
  { id: 'vegetarian', label: 'Vegetarian', color: '#EF6C00', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { id: 'dive-bar', label: 'Dive bar', color: '#37474F', image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&q=80' },
  { id: 'on-the-coast', label: 'On the coast', color: '#00695C', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80' },
];

export const DISCOVER_TABS = ['Places', 'Events'] as const;

export const DISCOVER_FILTER_CATEGORIES = [
  'All',
  'Beach bars',
  'Sundowners',
  'Night clubs',
  'Cafes',
  'Romantic',
  'Wine bars',
  'Vegetarian',
  'Dive bar',
  'On the coast',
] as const;

export const SEARCH_HISTORY: SearchHistoryEntry[] = [
  { id: '1', query: 'SBCLTR' },
  { id: '2', query: 'Himatsu' },
  { id: '3', query: 'The Lawns' },
  { id: '4', query: 'Events' },
];
