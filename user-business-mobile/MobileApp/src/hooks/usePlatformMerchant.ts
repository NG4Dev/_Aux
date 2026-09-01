import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { STRICT_LIVE_DATA, USE_CONVEX_DATA } from '@/config/features';
import {
  getBusinessById,
  getMenuCategoriesForBusiness,
  getMenuItemsForBusiness,
  getEventsForBusiness,
} from '@/data/mockBusinesses';

function useMockFallback(slug: string) {
  return {
    merchant: getBusinessById(slug),
    items: getMenuItemsForBusiness(slug),
    categories: getMenuCategoriesForBusiness(slug),
    events: getEventsForBusiness(slug),
  };
}

export function useMerchantBySlug(slug: string | undefined) {
  const convexMerchant = useQuery(
    api.platform.merchants.getBySlugWithMedia,
    USE_CONVEX_DATA && slug ? { slug } : 'skip',
  );

  if (!USE_CONVEX_DATA || !slug) {
    return { merchant: getBusinessById(slug ?? ''), isLoading: false };
  }

  if (convexMerchant === undefined) {
    return {
      merchant: STRICT_LIVE_DATA ? null : getBusinessById(slug),
      isLoading: true,
    };
  }

  if (convexMerchant === null) {
    return {
      merchant: STRICT_LIVE_DATA ? null : getBusinessById(slug),
      isLoading: false,
    };
  }

  const gallery =
    convexMerchant.gallery.length > 0
      ? convexMerchant.gallery
      : convexMerchant.coverUrl
        ? [
            {
              uri: convexMerchant.coverUrl,
              type: 'image' as const,
              width: 1080,
              height: 1080,
              aspect: 'square' as const,
            },
          ]
        : [];

  return {
    merchant: {
      id: convexMerchant.slug,
      name: convexMerchant.name,
      tagline: convexMerchant.tagline ?? '',
      type: convexMerchant.type,
      logo: convexMerchant.logoUrl ?? `https://i.pravatar.cc/160?u=${encodeURIComponent(convexMerchant.slug)}`,
      description: convexMerchant.description ?? '',
      hours: [],
      location: convexMerchant.location?.address
        ? {
            address: convexMerchant.location.address,
            lat: convexMerchant.location.lat ?? 0,
            lng: convexMerchant.location.lng ?? 0,
          }
        : null,
      locationGiven: Boolean(convexMerchant.location?.address),
      isFollowing: false,
      links: {},
      gallery,
    },
    isLoading: false,
  };
}

export function useMerchantProducts(slug: string | undefined) {
  const products = useQuery(
    api.platform.merchants.listProducts,
    USE_CONVEX_DATA && slug ? { merchantSlug: slug } : 'skip',
  );
  const menuCategories = useQuery(
    api.platform.merchants.listMenuCategories,
    USE_CONVEX_DATA && slug ? { merchantSlug: slug } : 'skip',
  );

  if (!USE_CONVEX_DATA || !slug) {
    const mock = useMockFallback(slug ?? '');
    return { items: mock.items, categories: mock.categories, isLoading: false };
  }

  if (products === undefined || menuCategories === undefined) {
    const mock = useMockFallback(slug);
    return {
      items: STRICT_LIVE_DATA ? [] : mock.items,
      categories: STRICT_LIVE_DATA ? [] : mock.categories,
      isLoading: true,
    };
  }

  const items = products.map((p: (typeof products)[number]) => ({
    id: p.slug,
    name: p.name,
    price: p.priceCents / 100,
    currency: p.currency.toUpperCase(),
    description: p.description,
    image: p.imageUrl ?? '',
    categoryId: p.categorySlug,
    categoryConvexId: String(p.categoryId),
    views: 0,
    postedAt: p.createdAt,
    mediaAspect: p.mediaAspect,
    imageWidth: p.imageWidth,
    imageHeight: p.imageHeight,
  }));

  const categories = menuCategories.map((c: (typeof menuCategories)[number]) => ({
    id: c.slug,
    name: c.name,
    itemIds: items
      .filter((item) => item.categoryId === c.slug)
      .map((item) => item.id),
  }));

  return {
    items,
    categories,
    isLoading: false,
  };
}

export function useMerchantEvents(slug: string | undefined) {
  const events = useQuery(
    api.platform.events.listForMerchant,
    USE_CONVEX_DATA && slug ? { merchantSlug: slug } : 'skip',
  );

  if (!USE_CONVEX_DATA || !slug) {
    return { events: getEventsForBusiness(slug ?? ''), isLoading: false };
  }

  if (events === undefined) {
    return {
      events: STRICT_LIVE_DATA ? [] : getEventsForBusiness(slug),
      isLoading: true,
    };
  }

  return {
    events: events.map((event: (typeof events)[number]) => ({
      id: event.slug,
      contentType: 'event' as const,
      title: event.name,
      subtitle: event.location ?? '',
      description: event.description ?? '',
      media: [],
      verified: true,
      profileName: slug,
      profileAvatar: '',
      businessId: slug,
      categories: ['Events'],
      status: 'upcoming' as const,
    })),
    isLoading: false,
  };
}
