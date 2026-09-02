export function getConvexErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('NOT_SIGNED_IN')) {
    return 'Please sign in to continue.';
  }
  if (message.includes('ADDRESS_REQUIRED')) {
    return 'Add a delivery address before checkout.';
  }
  if (message.includes('CART_EMPTY')) {
    return 'Your cart is empty.';
  }
  if (message.includes('USER_NOT_FOUND')) {
    return 'Account sync failed. Try signing in again.';
  }
  if (message.includes('Could not find public function')) {
    return 'App services are updating. Some features may be limited.';
  }

  return message || 'Something went wrong. Please try again.';
}
