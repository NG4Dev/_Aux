import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigation } from 'expo-router';

/** Align swipe-back with multi-step header back (decrement step before pop). */
export function useStepBackGesture(
  step: number,
  setStep: Dispatch<SetStateAction<number>>,
): { gestureEnabled: boolean } {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (step > 1) {
        e.preventDefault();
        setStep((prev) => prev - 1);
      }
    });
    return unsubscribe;
  }, [navigation, step, setStep]);

  return { gestureEnabled: step === 1 };
}
