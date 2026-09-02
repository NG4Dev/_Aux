import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ITEM_HEIGHT = 64;
const VISIBLE_ITEMS = 5;
const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getDaysInMonth = (monthIndex: number, year: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

export function formatDateOfBirth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_DOB = new Date(2000, 0, 1);

type WheelItemProps = {
  item: string | number;
  index: number;
  scrollY: Animated.Value;
};

const WheelItem = React.memo(({ item, index, scrollY }: WheelItemProps) => {
  const opacity = scrollY.interpolate({
    inputRange: [
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
    ],
    outputRange: [0.1, 0.4, 1, 0.4, 0.1],
    extrapolate: 'clamp',
  });

  const scale = scrollY.interpolate({
    inputRange: [
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
    ],
    outputRange: [0.85, 1.1, 0.85],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wheelItem}>
      <Animated.Text
        style={[styles.wheelText, { opacity, transform: [{ scale }] }]}
        allowFontScaling={false}
      >
        {item}
      </Animated.Text>
    </View>
  );
});

type WheelColumnProps = {
  data: Array<string | number>;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const WheelColumn = React.memo(
  ({ data, selectedIndex, onSelect }: WheelColumnProps) => {
    const listRef = useRef<FlatList<string | number>>(null);
    const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;
    const isUserInteracting = useRef(false);
    const currentSelection = useRef(selectedIndex);
    const isMounted = useRef(false);

    useEffect(() => {
      if (!listRef.current || data.length === 0) return;
      const safeIndex = clamp(selectedIndex, 0, data.length - 1);

      const performSync = (animated = true) => {
        if (!listRef.current) return;
        currentSelection.current = safeIndex;
        listRef.current.scrollToOffset({
          offset: safeIndex * ITEM_HEIGHT,
          animated,
        });
        scrollY.setValue(safeIndex * ITEM_HEIGHT);
      };

      if (!isMounted.current) {
        const timer = setTimeout(() => {
          performSync(false);
          isMounted.current = true;
        }, 150);
        return () => clearTimeout(timer);
      }
      if (!isUserInteracting.current && safeIndex !== currentSelection.current) {
        performSync(true);
      }
    }, [selectedIndex, data.length, scrollY]);

    const handleScrollEnd = useCallback(
      (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = clamp(Math.round(y / ITEM_HEIGHT), 0, data.length - 1);
        const targetOffset = index * ITEM_HEIGHT;

        if (Math.abs(y - targetOffset) > 0.5) {
          listRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
        }

        if (index !== currentSelection.current) {
          currentSelection.current = index;
          onSelect(index);
        }

        isUserInteracting.current = false;
      },
      [data.length, onSelect],
    );

    const renderItem = useCallback(
      ({ item, index }: { item: string | number; index: number }) => (
        <WheelItem item={item} index={index} scrollY={scrollY} />
      ),
      [scrollY],
    );

    return (
      <View style={styles.wheelColumn}>
        <Animated.FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item, index) => `wheel-${item}-${index}`}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          snapToAlignment="start"
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          onScrollBeginDrag={() => {
            isUserInteracting.current = true;
          }}
          onMomentumScrollBegin={() => {
            isUserInteracting.current = true;
          }}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            const velocity = e.nativeEvent.velocity?.y ?? 0;
            if (Math.abs(velocity) < 0.1) {
              handleScrollEnd(e);
            }
          }}
          contentContainerStyle={{
            paddingVertical: (LIST_HEIGHT - ITEM_HEIGHT) / 2,
          }}
          style={{ height: LIST_HEIGHT }}
          initialNumToRender={data.length}
          maxToRenderPerBatch={data.length}
          windowSize={5}
          removeClippedSubviews={false}
        />

        <View style={styles.selectionOverlay} pointerEvents="none">
          <View
            style={[
              styles.selectionLine,
              { top: (LIST_HEIGHT - ITEM_HEIGHT) / 2 },
            ]}
          />
          <View
            style={[
              styles.selectionLine,
              { top: (LIST_HEIGHT + ITEM_HEIGHT) / 2 },
            ]}
          />

          <LinearGradient
            colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
            style={[
              styles.gradientOverlay,
              { top: 0, height: (LIST_HEIGHT - ITEM_HEIGHT) / 2 },
            ]}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,1)']}
            style={[
              styles.gradientOverlay,
              { bottom: 0, height: (LIST_HEIGHT - ITEM_HEIGHT) / 2 },
            ]}
          />
        </View>
      </View>
    );
  },
);

type DateOfBirthPickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  title?: string;
  subtitle?: string;
};

export default function DateOfBirthPicker({
  value,
  onChange,
  title = "What's your date of birth?",
  subtitle,
}: DateOfBirthPickerProps) {
  const monthList = useMemo(
    () => [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    [],
  );
  const yearList = useMemo(
    () => Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i),
    [],
  );

  const currentYear = value.getFullYear();
  const currentMonth = value.getMonth();
  const currentDay = value.getDate();
  const daysInMonth = useMemo(
    () => getDaysInMonth(currentMonth, currentYear),
    [currentMonth, currentYear],
  );
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const updateDate = useCallback(
    (type: 'day' | 'month' | 'year', nextValue: number) => {
      let year = value.getFullYear();
      let month = value.getMonth();
      let day = value.getDate();

      if (type === 'day') day = nextValue;
      else if (type === 'month') month = nextValue;
      else year = nextValue;

      const lastDay = getDaysInMonth(month, year);
      if (day > lastDay) day = lastDay;

      onChange(new Date(year, month, day));
    },
    [onChange, value],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.wheelContainer}>
        <View style={styles.wheelBackground} />
        <WheelColumn
          data={monthList}
          selectedIndex={currentMonth}
          onSelect={(idx) => updateDate('month', idx)}
        />
        <View style={styles.wheelColumnDivider} />
        <WheelColumn
          data={daysArray}
          selectedIndex={Math.min(currentDay - 1, daysInMonth - 1)}
          onSelect={(idx) => updateDate('day', idx + 1)}
        />
        <View style={styles.wheelColumnDivider} />
        <WheelColumn
          data={yearList}
          selectedIndex={Math.max(0, yearList.indexOf(currentYear))}
          onSelect={(idx) => updateDate('year', yearList[idx]!)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
    marginBottom: 8,
  },
  wheelContainer: {
    flexDirection: 'row',
    height: LIST_HEIGHT,
    marginTop: 40,
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wheelBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 4,
  },
  wheelColumnDivider: {
    width: 1,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  wheelText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    height: ITEM_HEIGHT,
    lineHeight: ITEM_HEIGHT,
    paddingHorizontal: 12,
    overflow: 'visible',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: LIST_HEIGHT,
  },
  selectionLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
