# Detailed Authentication Flow Implementation Plan

This document serves as the exact blueprint for implementing the comprehensive authentication and onboarding flow for the `Aux` app, combining the desired routing architecture with the specific UI/UX described in the transcript and visual reference images.

## Overview
The goal is to provide a seamless, multi-step authentication experience that supports standard email/password, magic links (passwordless), social SSO, and a guest mode, culminating in a permissions-priming screen (notifications) before landing on the tabbed dashboard. 

---

## 1. Routing Architecture Hierarchy

To support the back-navigation rules and nested flows, the `app/` directory should be structured as follows:

```
app/
├── _layout.tsx                 (Root Stack)
├── index.tsx                   (Bootstrapper: checks auth state)
│
├── (auth)/
│   ├── _layout.tsx             (Stack explicitly for the auth flow)
│   ├── index.tsx               (Logo Screen -> Video Splash Screen)
│   ├── selection.tsx           (Hub: "Stay Informed", Social Buttons, Continue with Email)
│   │
│   ├── sign-in/
│   │   ├── _layout.tsx
│   │   ├── index.tsx           (Enter Email/Password)
│   │   ├── passwordless.tsx    (Enter Email for Magic Link)
│   │   ├── check-email.tsx     ("Email link has been sent" + Deep Link button)
│   │   └── return.tsx          (Deep link destination: 3 options - Remember, Set Password, Skip)
│   │
│   └── sign-up/
│       ├── _layout.tsx
│       ├── index.tsx           (Enter Email)
│       ├── password.tsx        (Create Password)
│       ├── dob.tsx             (Date of Birth)
│       └── names.tsx           (First & Last Name + Submit)
│
├── (onboarding)/
│   ├── _layout.tsx             (Stack for post-auth loading and permissions)
│   ├── success.tsx             (Green Checkmark -> Spinner)
│   └── notifications.tsx       (Turn on notifications / Not now)
│
└── (tabs)/
    ├── _layout.tsx             (Main Tab Bar Hub)
    ├── home.tsx                (Dashboard)
    ├── discover.tsx
    ├── library/...
    └── pay/...
```

---

## 2. Screen-by-Screen Specifications & Flow

### 2.1 Initialization & Welcome
**Reference:** Image 1, Transcript 11:58
- **Screen:** `(auth)/index.tsx`
- **Behavior:** 
  - Shows a static logo screen immediately on mount (simulating a native splash or acting as a loading gate while the video network request resolves).
  - Transitions to the full-screen Video Splash.
- **UI:** Background video, "Sign in" (purple), "Create account" (green), "Continue as guest" (transparent).
- **Navigation:**
  - "Sign in" -> Validates to `(auth)/selection` (mode: sign in)
  - "Create account" -> Validates to `(auth)/selection` (mode: sign up)
  - "Continue as guest" -> `router.push('/(tabs)/home')`

### 2.2 Auth Selection Hub
**Reference:** Image 2 (leftmost), Image 4 (leftmost), Transcript 11:58-59
- **Screen:** `(auth)/selection.tsx`
- **UI:** Background image with a blur effect gradient transitioning to opaque at the bottom. The app logo and copy ("Stay Informed. Stay Connected.").
- **Buttons:** 
  1. Continue with Email
  2. Continue with Facebook
  3. Continue with Google
  4. Continue with Apple
- **Footer Text:** "Don't have an account? Sign up" (or "Already have an account? Sign in"). Tapping this swaps the underlying target of "Continue with Email".
- **Navigation:**
  - Back Button -> Returns to Video Splash `(auth)/index.tsx`.
  - Continue with Email -> Goes to `(auth)/sign-in/` OR `(auth)/sign-up/` depending on the current mode.
  - Social Buttons -> Trigger Clerk social OAuth flows.

### 2.3 Sign In Flow
**Reference:** Image 2, Transcript 12:00
- **Screen:** `(auth)/sign-in/index.tsx`
- **UI:** Email field, Password field, "Sign in" button, "Sign in without password" text link.
- **Navigation:**
  - Back Button -> Returns to `(auth)/selection.tsx`.
  - "Sign in without password" -> Goes to `(auth)/sign-in/passwordless.tsx`.
  - Success -> `/(onboarding)/success.tsx`.

### 2.4 Sign Up Flow (Email)
**Reference:** Images 4 & 5, Transcript 12:03
Must be a step-by-step wizard. Buttons start disabled and become active upon successful validation.
1. **Screen:** `(auth)/sign-up/index.tsx` -> Enter Email Address. NEXT.
2. **Screen:** `(auth)/sign-up/password.tsx` -> Create Password with criteria indicators. NEXT.
3. **Screen:** `(auth)/sign-up/dob.tsx` -> Wheel picker for Date of Birth. NEXT.
4. **Screen:** `(auth)/sign-up/names.tsx` -> First and Last Name, Terms & Conditions checkbox. "CREATE ACCOUNT".
- **Navigation:** 
  - Back Button goes one step back logically.
  - Success -> `/(onboarding)/success.tsx`.

### 2.5 Passwordless / Magic Link Flow
**Reference:** Image 3, Transcript 12:01
1. **Screen:** `(auth)/sign-in/passwordless.tsx` -> Enter Email Address. NEXT.
2. **Screen:** `(auth)/sign-in/check-email.tsx` -> "Email link has been sent" + "Open Email App" button. 
3. **Deep Link:** User taps email link, returns to app.
4. **Screen:** `(auth)/sign-in/return.tsx` -> Three options:
   - "Remember this device" -> Completes auth, routes to `/(onboarding)/notifications.tsx`.
   - "Set a new password" -> Routes to a reset password screen (similar to create password), then to notifications.
   - "Skip" -> Routes to `/(onboarding)/notifications.tsx`.

### 2.6 Post-Authentication Onboarding
**Reference:** Image 2 (right), Image 5 (right), Transcript 12:00
Applies to both sign-in and sign-up success paths.
1. **Screen:** `/(onboarding)/success.tsx` -> Render a Green Checkmark animation, which transitions into a Loading Spinner while Clerk session fully settles/fetches user data.
2. **Screen:** `/(onboarding)/notifications.tsx` 
   - **UI:** "Turn on notifications", "Not now".
   - **Logic:** If the user has already seen this or enabled/disabled notifications in a previous session, we silently skip this page.
   - **Navigation:** Both actions ultimately execute `router.replace('/(tabs)/home')`.

### 2.7 The Guest Dashboard Experience
**Reference:** Transcript 12:04 - 12:05
- Pressing "Continue as guest" jumps directly to `/(tabs)/home.tsx`.
- **Exit Logic:** From the dashboard (home tab), navigating back behaves specifically:
  - First back swipe/button press: Display a toast/snackbar saying "Press back again to exit".
  - Second swipe/button press: Exit the app cleanly.

---

## 3. Next Actions for Implementation Agent
1. Setup the directory structure defined in Part 1.
2. Create standard UI components for the headers, disabled/active Next buttons, and text inputs to ensure the wizard screens look uniform.
3. Implement `(auth)/index.tsx`, `selection.tsx`, and the deep linking configurations for the Magic Link flow in `app.json`.
4. Implement the Sign Up wizard screens using React Hook Form and Zustand/React Context to maintain the wizard state across routes before finalizing the `signUp.create()` call in Clerk.
5. Create the onboarding layout and the hardware back-button listener logic on the Home tab. 
