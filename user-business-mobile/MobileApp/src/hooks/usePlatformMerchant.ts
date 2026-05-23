import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { USE_CONVEX_DATA } from '@/config/features';
import {
  getBusinessById,
  getMenuCategoriesForBusiness,
  getMenuItemsForBusiness,
  getEventsForBusiness,
} from '@/data/mockBusinesses';

export function useMerchantBySlug(slug: string | undefined) {
  const convexMerchant = useQuery(
    api.platform.merchants.getBySlug,
    USE_CONVEX_DATA && slug ? { slug } : 'skip',
  );

  if (!USE_CONVEX_DATA || !slug) {
    return { merchant: getBusinessById(slug ?? ''), isLoading: false };
  }

  if (convexMerchant === undefined) {
    return { merchant: getBusinessById(slug), isLoading: true };
  }

  if (convexMerchant === null) {
    return { merchant: getBusinessById(slug), isLoading: false };
  }

  return {
    merchant: {
      id: convexMerchant.slug,
      name: convexMerchant.name,
      tagline: convexMerchant.tagline ?? '',
      type: convexMerchant.type,
      logo: '',
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
      gallery: [],
    },
    isLoading: false,
  };
}

export function useMerchantProducts(slug: string | undefined) {
  const products = useQuery(
    api.platform.merchants.listProducts,
    USE_CONVEX_DATA && slug ? { merchantSlug: slug } : 'skip',
  );

  if (!USE_CONVEX_DATA || !slug) {
    return {
      items: getMenuItemsForBusiness(slug ?? ''),
      categories: getMenuCategoriesForBusiness(slug ?? ''),
      isLoading: false,
    };
  }

  if (products === undefined) {
    return {
      items: getMenuItemsForBusiness(slug),
      categories: getMenuCategoriesForBusiness(slug),
      isLoading: true,
    };
  }

  const categoryMap = new Map<string, { id: string; name: string; itemIds: string[] }>();
  const items = products.map((p: (typeof products)[number]) => {
    const categoryId = String(p.categoryId);
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: 'Menu',
        itemIds: [],
      });
    }
    categoryMap.get(categoryId)!.itemIds.push(p.slug);
    return {
      id: p.slug,
      name: p.name,
      price: p.priceCents / 100,
      currency: p.currency.toUpperCase(),
      description: p.description,
      image: p.imageUrl ?? '',
      categoryId,
      views: 0,
      postedAt: p.createdAt,
      mediaAspect: p.mediaAspect,
      imageWidth: p.imageWidth,
      imageHeight: p.imageHeight,
    };
  });

  return {
    items,
    categories: [...categoryMap.values()],
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
    return { events: getEventsForBusiness(slug), isLoading: true };
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
