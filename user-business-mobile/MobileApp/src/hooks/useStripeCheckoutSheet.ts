import { useAction } from 'convex/react';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type PayResult = { canceled: true } | { canceled: false; paymentIntentId: string };

export function useStripeCheckoutSheet() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const createPaymentIntent = useAction(api.checkout.createPaymentIntent);

  const payForOrder = async (
    orderId: Id<'orders'>,
    merchantDisplayName: string,
  ): Promise<PayResult> => {
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      orderId,
    });

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName,
      paymentIntentClientSecret: clientSecret,
      applePay: { merchantCountryCode: 'GB' },
      googlePay: {
        merchantCountryCode: 'GB',
        testEnv: __DEV__,
      },
      returnURL: 'aux://stripe-redirect',
    });

    if (initError) {
      throw new Error(initError.message);
    }

    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      if (presentError.code === 'Canceled') {
        return { canceled: true };
      }
      throw new Error(presentError.message);
    }

    return { canceled: false, paymentIntentId };
  };

  return { payForOrder };
}
