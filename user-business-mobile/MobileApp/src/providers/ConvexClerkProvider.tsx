import { ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { convex } from '@/convex/client';

export default function ConvexClerkProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
