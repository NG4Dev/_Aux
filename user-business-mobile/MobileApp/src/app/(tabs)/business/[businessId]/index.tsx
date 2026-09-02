import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated as RNAnimated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getBusinessById,
  getTabsForBusiness,
} from '@/data/mockBusinesses';
import {
  useMerchantBySlug,
  useMerchantEvents,
  useMerchantProducts,
} from '@/hooks/usePlatformMerchant';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import HoursRow from '@/components/business/HoursRow';
import LocationRow from '@/components/business/LocationRow';
import ProfileTabBar, {
  PROFILE_TAB_BAR_HEIGHT,
} from '@/components/business/ProfileTabBar';
import MenuTab from '@/components/business/MenuTab';
import GalleryTab from '@/components/business/GalleryTab';
import EventsTab from '@/components/business/EventsTab';
import AboutTab from '@/components/business/AboutTab';
import type { ProfileTabId } from '@/types/business';

const HEADER_ROW_HEIGHT = 48;
const DETAIL_BLOCK_HEIGHT = 248;
const COLLAPSIBLE_HEIGHT = HEADER_ROW_HEIGHT + DETAIL_BLOCK_HEIGHT;
const STICKY_TOTAL = COLLAPSIBLE_HEIGHT + PROFILE_TAB_BAR_HEIGHT;

export default function BusinessProfile() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const router = useRouter();

  const businessIdParam = businessId ?? '';
  const { merchant: business } = useMerchantBySlug(businessIdParam);
  const { items: menuItems, categories: menuCategories } =
    useMerchantProducts(businessIdParam);
  const { events: merchantEvents } = useMerchantEvents(businessIdParam);

  const businessFallback = businessId ? getBusinessById(businessId) : undefined;
  const resolvedBusiness = business ?? businessFallback;

  const tabs = useMemo<ProfileTabId[]>(
    () => (resolvedBusiness ? getTabsForBusiness(resolvedBusiness) : []),
    [resolvedBusiness],
  );

  const [activeTab, setActiveTab] = useState<ProfileTabId | null>(
    tabs[0] ?? null,
  );
  const [isFollowing, setIsFollowing] = useState<boolean>(
    resolvedBusiness?.isFollowing ?? false,
  );

  const { animatedHeight, onScroll } = useCollapsibleHeader({
    headerHeight: COLLAPSIBLE_HEIGHT,
  });

  if (!resolvedBusiness) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Business not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentTab = activeTab ?? tabs[0];

  const renderTab = () => {
    switch (currentTab) {
      case 'Menu':
        return (
          <MenuTab
            business={resolvedBusiness}
            categories={menuCategories}
            items={menuItems}
            contentPaddingTop={STICKY_TOTAL + 12}
            onScroll={onScroll}
          />
        );
      case 'Gallery':
        return (
          <GalleryTab
            business={resolvedBusiness}
            contentPaddingTop={STICKY_TOTAL + 12}
            onScroll={onScroll}
          />
        );
      case 'Events':
        return (
          <EventsTab
            events={merchantEvents}
            contentPaddingTop={STICKY_TOTAL + 12}
            onScroll={onScroll}
            onEventPress={(event) =>
              router.push({
                pathname: '/(tabs)/business/[businessId]/event/[eventId]',
                params: {
                  businessId: resolvedBusiness.id,
                  eventId: event.id,
                },
              })
            }
          />
        );
      case 'About':
        return (
          <AboutTab
            business={resolvedBusiness}
            contentPaddingTop={STICKY_TOTAL + 12}
            onScroll={onScroll}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderTab()}

      <View style={styles.stickyBlock}>
        <RNAnimated.View
          style={{ height: animatedHeight, overflow: 'hidden' }}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailBlock}>
            <View style={styles.identityRow}>
              <Image
                source={{ uri: resolvedBusiness.logo }}
                style={styles.logo}
              />
              <View style={styles.identityText}>
                <Text style={styles.name} numberOfLines={1}>
                  {resolvedBusiness.name}
                </Text>
                {resolvedBusiness.tagline && (
                  <Text style={styles.tagline} numberOfLines={1}>
                    {resolvedBusiness.tagline}
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.description} numberOfLines={3}>
              {resolvedBusiness.description}
            </Text>

            <View style={styles.metaCol}>
              <HoursRow hours={resolvedBusiness.hours} />
              <LocationRow
                location={resolvedBusiness.location}
                locationGiven={resolvedBusiness.locationGiven}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing && styles.followBtnActive,
              ]}
              onPress={() => setIsFollowing((v) => !v)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.followText,
                  isFollowing && styles.followTextActive,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </RNAnimated.View>

        <ProfileTabBar
          tabs={tabs}
          active={currentTab}
          onSelect={(tab) => setActiveTab(tab as ProfileTabId)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  stickyBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: HEADER_ROW_HEIGHT,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBlock: {
    paddingHorizontal: 16,
    height: DETAIL_BLOCK_HEIGHT,
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  identityText: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  metaCol: {
    gap: 8,
  },
  followBtn: {
    marginTop: 4,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  followText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  followTextActive: {
    color: '#fff',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
