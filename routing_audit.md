# Routing Architecture Audit

This document is an exhaustive deep-dive audit comparing the **Current State** of the `Aux` app's routing architecture against the **Target State** described in the reference application.

## Current Architecture

Currently, the `app/` directory looks like this:

```
app/
├── _layout.tsx           <-- Uses <Slot />, NOT <Stack />
├── homepage.tsx          <-- Direct file route, not in a Tab structure
├── (auth)/
│   ├── _layout.tsx       <-- <Stack> for auth screens, checks `isSignedIn`
│   ├── index.tsx         <-- Splash screen / Welcome (Video)
│   ├── sign-in.tsx       
│   ├── sign-up.tsx       
│   └── verify.tsx        
└── (protected)/
    ├── _layout.tsx
    └── index.tsx
```

### Critical Issues with Current Architecture:
1. **No Root Stack:** The root `_layout.tsx` uses a React Native `<Slot />` inside of the `<ClerkProvider>`. This means there is no native navigation container at the top level to manage transitions between the auth screens, the protected screens, and tabs. It simply swaps files out abruptly.
2. **Missing Root Entry Redirect:** There is no `app/index.tsx` file at the root to properly bootstrap and redirect the user automatically to either `/home` (unprotected guest) or the `(auth)` group.
3. **Improper Unprotected/Protected Flow:** Currently, checking `"Continue as guest"` sends the user to `homepage.tsx`. However, `homepage.tsx` is just a loose file in the root directory. It doesn't belong to a unified `(tabs)` group.
4. **No Tabs Navigation Hub:** The target design calls for a tab bar (Home, Discover, Library, Pay) that persists whether a user is fully authenticated or just browsing as a guest (up until checkout/private actions). Currently, this does not exist.
5. **Route Naming Mismatch:** The target references a `/home` tab route, but currently we have a standalone `/homepage` file.

---

## Target Architecture (To Be Implemented)

Based on the reference, we need to restructure the app strictly as follows:

```
app/
├── _layout.tsx           <-- ROOT LAYOUT: Must export a <Stack> with generic screens.
├── index.tsx             <-- BOOTSTRAPPER: <Redirect href="/home" />
│
├── (auth)/               <-- AUTH GROUP (Modal or standalone stack)
│   ├── _layout.tsx
│   ├── index.tsx         <-- Splash / Login options
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── verify.tsx
│
├── (tabs)/               <-- MAIN HUB (Unprotected & Protected)
│   ├── _layout.tsx       <-- Tab Bar definition
│   ├── home.tsx
│   ├── discover.tsx
│   ├── library/          <-- Nested Stack for internal history
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── history.tsx
│   └── pay/              <-- Nested Stack for internal history
│       ├── _layout.tsx
│       ├── index.tsx
│       └── manageWallet.tsx
│
└── wallet/               <-- ROOT MODALS / FULL SCREENS (Sibling to tabs)
    ├── configureWallet.tsx
    ├── manageWallet.tsx
    └── disableWallet.tsx
```

### Action Plan to Bridge the Gap:

1. **Fix Root Layout:** 
   Modify `app/_layout.tsx` to return a native `<Stack>` inside the `<ClerkProvider>`. Ensure `(tabs)` is a registered screen with `options={{ headerShown: false }}`.
2. **Add Root Index:** 
   Create `app/index.tsx` which will determine the initial route. Usually, this checks Clerk's `isLoaded` and `isSignedIn` state to redirect to `/(tabs)/home` or the splash screen.
3. **Build the `(tabs)` Group:**
   Create `app/(tabs)/_layout.tsx` utilizing `expo-router`'s `<Tabs>` component. We will build out `home.tsx`, `discover.tsx` and the nested folders (`pay/`, `library/`) here. The tab bar must have the "fog type appearance".
4. **Refactor Auth Routing Flow:**
   Instead of forcing the user into `(auth)` immediately upon app start (or getting trapped in a `homepage.tsx` file), the user should enter the `(tabs)` flow as a guest. The `(auth)` stack should be presented either initially (if we want to force them through a splash screen) or when they try to access protected sub-screens (like `/pay` or `/wallet`).

By aligning with the target architecture, we will nail the motion between the tab stack and the modal overlays (`wallet/`), and "Continue as guest" will simply let the user interact with the `home` and `discover` tabs seamlessly.
