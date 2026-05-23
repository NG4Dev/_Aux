# Routing Update Implementation Plan

This plan tracks the steps required to overhaul the `Aux` app's routing architecture. We will implement the desired flow outlined in our `routing_audit.md` and reference the code structure provided in the `tabs-app`.

## Core Objectives
1. **Unprotected Exploration:** Allow users to use the app (Home, Discover) as guests without being forced through authentication immediately.
2. **Tabbed Navigation Hub:** Implement the `(tabs)` group as the central UI containing the fog-style tab bar.
3. **Modal Wallet Overlays:** Ensure the root `wallet/` routes sit outside of the tab context so they slide up over the entire application.
4. **Seamless Authentication Handling:** Keep `(auth)` as a distinct group that we can invoke when a guest user tries to access a protected route (like `pay` or `library`).

---

## Step-by-Step Implementation Roadmap

### Phase 1: Establish the Root Architecture
- [x] **Modify `app/_layout.tsx`:** 
  - Wrap the app in a `<Stack>`.
  - Add `<Stack.Screen name="(tabs)" options={{ headerShown: false }}/>`.
  - Ensure the Clerk provider wraps this stack.
- [x] **Create `app/index.tsx`:** 
  - Add a redirect component depending on Clerk state:
    - If `isSignedIn === false`, check if they've seen the splash screen before (we can route them to `/(auth)` index first to see the video, from where they click "Continue as guest").
    - "Continue as guest" will simply `router.push('/(tabs)/home')`.

### Phase 2: Implement the Main App Hub (`(tabs)`)
- [x] **Create `app/(tabs)/_layout.tsx`:** 
  - Implement the `<Tabs>` navigator.
  - Define the screens: `home`, `discover`, `library`, and `pay`.
  - Add the custom "fog type appearance" UI for the tab bar.
- [x] **Create Tab Screens:**
  - Create `app/(tabs)/home.tsx` (migrating logic from `homepage.tsx`).
  - Create `app/(tabs)/discover.tsx`.
- [x] **Create Nested Stacks inside Tabs:**
  - Create `app/(tabs)/pay/_layout.tsx` and `index.tsx`.
  - Create `app/(tabs)/library/_layout.tsx` and `index.tsx`.

### Phase 3: Set up Protected Routing Logic
- [x] **Implement Auth Guards:** 
  - We need to ensure that when a guest user clicks on the `Pay` or `Library` tabs, they are intercepted.
  - *Implementation Details:* We can either use Expo Router's `useSegments` in an effect (to check if `segment === 'pay'` and `!isSignedIn`, then redirect to `/(auth)`), OR we can handle this via custom Tab Bar buttons that check Auth before routing. 

### Phase 4: Sibling Root Modals
- [x] **Create Sibling Screens in Root `app/wallet/`:**
  - `configureWallet.tsx`
  - `manageWallet.tsx`
  - `disableWallet.tsx`
  - Add these screens to the root `app/_layout.tsx` stack with presentation options like `presentation: 'modal'`.

### Phase 5: Cleanup
- [x] **Delete the orphaned `app/homepage.tsx` file once its contents are moved to `app/(tabs)/home.tsx`.**
- [ ] **Verify the whole stack starts gracefully, video splash plays, and guest/authenticated transitions feel native.**
