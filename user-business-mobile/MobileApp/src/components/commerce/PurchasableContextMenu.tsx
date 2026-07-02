import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OVERLAY_GRADIENT_TOP } from '@/components/commerce/getSheetSnapPoints';
import Colors from '@/constants/Colors';
import { discoverLog } from '@/services/discoverFlowLogger';
import type { MediaAspect } from '@/types/content';

const MENU_HERO_SIZE = 120;
const MENU_ROW_COUNT = 8;
const TAG_RECOMMEND = '#FFC107';
const TAG_DO_NOT_RECOMMEND = '#E57373';

export type PurchasableContextMenuProps = {
  visible: boolean;
  onClose: (source: 'backdrop' | 'menuChevron' | 'back') => void;
  productName: string;
  productSubtitle?: string;
  imageUrl?: string | null;
  mediaAspect?: MediaAspect;
  profileName?: string;
  profileAvatar?: string | null;
  inCart: boolean;
  isLiked: boolean;
  onLike: () => void;
  onAddCart: () => void;
  onRemoveCart?: () => void;
  onShare: () => void;
  onAddToList: () => void;
  onRecommendSimilar?: () => void;
  onDoNotRecommendSimilar?: () => void;
  onDoNotRecommendBusiness?: () => void;
  onReport?: () => void;
};

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor?: string;
  destructive?: boolean;
};

function MenuRow({ icon, label, onPress, iconColor = '#fff', destructive }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={24} color={destructive ? '#ff5252' : iconColor} />
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PurchasableContextMenu({
  visible,
  onClose,
  productName,
  productSubtitle,
  imageUrl,
  profileName,
  profileAvatar,
  inCart,
  isLiked,
  onLike,
  onAddCart,
  onRemoveCart,
  onShare,
  onAddToList,
  onRecommendSimilar,
  onDoNotRecommendSimilar,
  onDoNotRecommendBusiness,
  onReport,
}: PurchasableContextMenuProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    discoverLog('overlay', 'contextMenuLayout', {
      menuHeroSize: MENU_HERO_SIZE,
      rowCount: MENU_ROW_COUNT,
      scrollHeight: 'flex',
    });
  }, [visible]);

  const runAction = (action: () => void) => {
    onClose('menuChevron');
    action();
  };

  const handleCartPress = () => {
    if (inCart) {
      onRemoveCart?.();
    } else {
      onAddCart();
    }
  };

  const cartIconColor = inCart ? '#ff5252' : Colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onClose('back')}
    >
      <LinearGradient
        colors={[OVERLAY_GRADIENT_TOP, 'rgba(26,18,12,0.98)', '#0D0D0D']}
        style={styles.root}
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.menuHeader}>
            <TouchableOpacity
              style={styles.menuChevronBtn}
              onPress={() => onClose('menuChevron')}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroSummary}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroImageEmpty]} />
            )}
            <Text style={styles.heroTitle}>{productName}</Text>
            {productSubtitle ? (
              <Text style={styles.heroSubtitle} numberOfLines={2}>
                {productSubtitle}
              </Text>
            ) : null}
            {profileName ? (
              <View style={styles.profileRow}>
                {profileAvatar ? (
                  <Image source={{ uri: profileAvatar }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, styles.heroImageEmpty]} />
                )}
                <Text style={styles.profileName}>{profileName}</Text>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              </View>
            ) : null}
          </View>

          <ScrollView
            style={styles.menu}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            <MenuRow
              icon={isLiked ? 'heart' : 'heart-outline'}
              label="Like"
              onPress={() => runAction(onLike)}
              iconColor="#ff5252"
            />
            <MenuRow
              icon={inCart ? 'cart' : 'add-circle-outline'}
              label={inCart ? 'Remove from cart' : 'Add to cart'}
              onPress={() => runAction(handleCartPress)}
              iconColor={cartIconColor}
            />
            <MenuRow
              icon="share-outline"
              label="Share"
              onPress={() => runAction(onShare)}
            />
            <MenuRow
              icon="list-outline"
              label="Add to list"
              onPress={() => runAction(onAddToList)}
            />
            <MenuRow
              icon="pricetag-outline"
              label="Recommend similar products"
              onPress={() => runAction(() => onRecommendSimilar?.())}
              iconColor={TAG_RECOMMEND}
            />
            <MenuRow
              icon="pricetag"
              label="Do not recommend similar products"
              onPress={() => runAction(() => onDoNotRecommendSimilar?.())}
              iconColor={TAG_DO_NOT_RECOMMEND}
            />
            <MenuRow
              icon="storefront-outline"
              label="Do not recommend this business"
              onPress={() => runAction(() => onDoNotRecommendBusiness?.())}
            />
            <MenuRow
              icon="information-circle-outline"
              label="Report"
              onPress={() => runAction(() => onReport?.())}
              destructive
            />
          </ScrollView>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuChevronBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSummary: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    marginBottom: 4,
  },
  heroImage: {
    width: MENU_HERO_SIZE,
    height: MENU_HERO_SIZE,
    borderRadius: 8,
    marginBottom: 12,
  },
  heroImageEmpty: {
    backgroundColor: '#333',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  profileName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  menu: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 56,
    paddingVertical: 14,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  rowLabelDestructive: {
    color: '#ff5252',
  },
});
