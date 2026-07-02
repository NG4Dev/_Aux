import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const DARK_STACK_OPTIONS: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#000' },
  animation: 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

export const AUTH_HEADER_OPTIONS: Pick<
  NativeStackNavigationOptions,
  'headerStyle' | 'headerTintColor' | 'headerTitleAlign' | 'headerShadowVisible'
> = {
  headerStyle: { backgroundColor: '#000' },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerShadowVisible: false,
};
