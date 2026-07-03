import React from 'react';

import { View, Text, StyleSheet, Pressable } from 'react-native';

import Animated, {

  type AnimatedRef,

  type SharedValue,

  useAnimatedProps,

  useAnimatedStyle,

  interpolate,

  Extrapolation,

} from 'react-native-reanimated';

import {
  headerThumbHandoffOpacity,
  expandProgressFromSheet,
} from '@/components/commerce/menuTransitionTokens';



type OverlayMiniPlayerBarProps = {

  productName: string;

  productSubtitle?: string;

  imageUrl?: string | null;

  sheetTranslateY: SharedValue<number>;

  collapsedOffsetSV: SharedValue<number>;

  barRef: AnimatedRef<Animated.View>;

  thumbRef: AnimatedRef<Animated.View>;

  morphTargetAnchorRef?: AnimatedRef<Animated.View>;

  onBarLayout?: () => void;

  onThumbLayout?: () => void;

  onMorphTargetLayout?: () => void;

  onPress?: () => void;

};



const AnimatedView = Animated.createAnimatedComponent(View);



export default function OverlayMiniPlayerBar({

  productName,

  productSubtitle,

  imageUrl,

  sheetTranslateY,

  collapsedOffsetSV,

  barRef,

  thumbRef,

  morphTargetAnchorRef,

  onBarLayout,

  onThumbLayout,

  onMorphTargetLayout,

  onPress,

}: OverlayMiniPlayerBarProps) {

  const thumbImageStyle = useAnimatedStyle(() => {

    const expandProgress = expandProgressFromSheet(

      sheetTranslateY.value,

      collapsedOffsetSV.value,

    );

    return {
      opacity: headerThumbHandoffOpacity(expandProgress),
    };

  });



  const animatedProps = useAnimatedProps(() => ({

    pointerEvents: 'none' as const,

  }));



  const inner = (

    <View style={styles.inner} pointerEvents="box-none">

      <Animated.View

        ref={morphTargetAnchorRef ?? thumbRef}

        style={styles.thumb}

        onLayout={onMorphTargetLayout ?? onThumbLayout}

      >

        <Animated.View ref={morphTargetAnchorRef ? thumbRef : undefined} style={styles.thumbInner}>

          {imageUrl ? (

            <Animated.Image

              source={{ uri: imageUrl }}

              style={[styles.thumbImage, thumbImageStyle]}

              resizeMode="cover"

            />

          ) : null}

        </Animated.View>

      </Animated.View>

      <View style={styles.textCol}>

        <Text style={styles.name} numberOfLines={1}>

          {productName}

        </Text>

        {productSubtitle ? (

          <Text style={styles.subtitle} numberOfLines={1}>

            {productSubtitle}

          </Text>

        ) : null}

      </View>

    </View>

  );



  return (

    <AnimatedView

      ref={barRef}

      style={styles.slot}

      animatedProps={animatedProps}

      onLayout={onBarLayout}

      pointerEvents="box-none"

    >

      {onPress ? (

        <Pressable

          onPress={onPress}

          style={styles.pressable}

          accessibilityRole="button"

          accessibilityLabel="Collapse menu queue"

        >

          {inner}

        </Pressable>

      ) : (

        inner

      )}

    </AnimatedView>

  );

}



const styles = StyleSheet.create({

  slot: {

    flex: 1,

    minWidth: 0,

    justifyContent: 'center',

  },

  pressable: {

    flex: 1,

    minWidth: 0,

  },

  inner: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    paddingHorizontal: 4,

  },

  thumb: {

    width: 36,

    height: 36,

    borderRadius: 6,

    overflow: 'hidden',

  },

  thumbInner: {

    width: 36,

    height: 36,

    borderRadius: 6,

    overflow: 'hidden',

  },

  thumbImage: {

    width: 36,

    height: 36,

    borderRadius: 6,

  },

  textCol: {

    flex: 1,

    minWidth: 0,

  },

  name: {

    color: '#fff',

    fontSize: 14,

    fontWeight: '700',

  },

  subtitle: {

    color: 'rgba(255,255,255,0.55)',

    fontSize: 12,

    marginTop: 2,

  },

});


