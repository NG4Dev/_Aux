import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export type PurchasableContextMenuProps = {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productSubtitle?: string;
  imageUrl?: string | null;
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
      <Ionicons name={icon} size={22} color={destructive ? '#ff5252' : iconColor} />
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

  if (!visible) return null;

  const handleCartPress = () => {
    if (inCart) {
      onRemoveCart?.();
    } else {
      onAddCart();
    }
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />

      <LinearGradient
        colors={['rgba(61,42,31,0.97)', 'rgba(26,18,12,0.98)', 'rgba(0,0,0,0.99)']}
        style={[styles.panel, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.heroSummary}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
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

        <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
          <MenuRow
            icon={isLiked ? 'heart' : 'heart-outline'}
            label="Like"
            onPress={onLike}
            iconColor={isLiked ? '#ff5252' : '#fff'}
          />
          <MenuRow
            icon={inCart ? 'cart' : 'cart-outline'}
            label={inCart ? 'Remove from cart' : 'Add to cart'}
            onPress={handleCartPress}
            iconColor={inCart ? Colors.primary : '#fff'}
          />
          <MenuRow icon="share-outline" label="Share" onPress={onShare} />
          <MenuRow icon="list-outline" label="Add to list" onPress={onAddToList} />
          <MenuRow
            icon="eye-outline"
            label="Recommend similar products"
            onPress={() => onRecommendSimilar?.()}
          />
          <MenuRow
            icon="eye-off-outline"
            label="Do not recommend similar products"
            onPress={() => onDoNotRecommendSimilar?.()}
          />
          <MenuRow
            icon="storefront-outline"
            label="Do not recommend this business"
            onPress={() => onDoNotRecommendBusiness?.()}
          />
          <MenuRow
            icon="alert-circle-outline"
            label="Report"
            onPress={() => onReport?.()}
            destructive
          />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    maxHeight: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
  },
  heroSummary: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  heroImage: {
    width: 120,
    height: 120,
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
    textAlign: 'center',
    marginTop: 4,
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
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  rowLabelDestructive: {
    color: '#ff5252',
  },
});
