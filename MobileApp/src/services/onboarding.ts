import * as SecureStore from 'expo-secure-store';

const ONBOARDING_COMPLETED_KEY = 'onboarding_apple_invites_completed';

export const isOnboardingCompleted = async (): Promise<boolean> => {
  const result = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
  return result === 'true';
};

export const markOnboardingComplete = async (): Promise<void> => {
  await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
  
  // Future implementation: also flag the backend via API
  // e.g. await api.post('/user/onboarding', { completed: true });
};
