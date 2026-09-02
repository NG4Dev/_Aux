import { useEffect, type MutableRefObject } from 'react';
import { useNavigation } from 'expo-router';

type OnboardingExitGuardOptions = {
  /** When true, beforeRemove is not blocked (e.g. notifications "Not now"). */
  allowExitRef?: MutableRefObject<boolean>;
};

/** Prevent swipe-back / hardware back from leaving incomplete onboarding. */
export function useOnboardingExitGuard(
  options?: OnboardingExitGuardOptions,
): { gestureEnabled: boolean } {
  const navigation = useNavigation();
  const allowExitRef = options?.allowExitRef;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowExitRef?.current) return;
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation, allowExitRef]);

  return { gestureEnabled: false };
}
