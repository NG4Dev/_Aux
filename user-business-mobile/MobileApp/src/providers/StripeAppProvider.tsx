import { ReactNode } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in MobileApp/.env',
  );
}

export default function StripeAppProvider({ children }: { children: ReactNode }) {
  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.galyvant.aux"
      urlScheme="aux"
    >
      {children}
    </StripeProvider>
  );
}
