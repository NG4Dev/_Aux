# Aux Project Roadmap & Tasks

This roadmap is based on the voice transcript from March 10, 2026, outlining the enhancements and features for the Aux application.

## 1. Authentication & Onboarding Enhancements

### Create Account Flow
- [ ] **Advanced Error Handling**:
    - [ ] Implement succinct Toast notifications at the bottom for Clerk errors.
    - [ ] Include error codes and clear messages in Toasts.
    - [ ] Add a "Fix It" text button in the Toast to route the user back to the specific step (e.g., email or password page).
    - [ ] Ensure routing allows resuming the multi-step flow from the failed page rather than restarting.

### Sign-In Flow
- [ ] **Magic Link Integration**: Complete the frontend implementation of Clerk Magic Link sign-in.
- [ ] **Post-Auth Password Setup**: Implement the flow to set a password if a user logs in via Magic Link for the first time.

### Onboarding Experience
- [ ] **Visual Overhaul**: Update all images, logos, and copy on the splash screen and auth pages.
- [ ] **Apple Invites Onboarding**:
    - [ ] Implement the "scrolling video" effect (retrofit from reference volume/Vadim project).
- [ ] **Twitter Preferences Collection**: Build the preferences selection screen.
- [ ] **Notification Step**: Position the notification request at the end of the onboarding sequence.

## 2. User Interface & Product Tour

### Gestures & Navigation
- [ ] **Gesture Onboarding**: Create interactive screens explaining app gestures (feed swiping, swipe right for AI chat).
- [ ] **AI Chat Integration**: Implement "swipe right to see AI chat on the left" (similar to Instagram Story camera access).
- [ ] **Gesture Conflict Resolution**: Adjust or disable system gestures (like double swipe to exit) that conflict with the AI chat swipe.

### Interactive Product Tours
- [ ] **Gmail-style Tours**: Implement overlay tours for first-time visitors to each major screen (Home, Discover, etc.).
- [ ] **Tour Persistence**: Track tour completion/dismissal in the database to prevent repeat showings.
- [ ] **Progress Tracking**: Implement granular internal analytics for user progress through the tour.

## 3. Core App Features (Regular User)

### Dashboard & Discovery
- [ ] **Home Dashboard**: Implement expanded views for products, places, and events.
- [ ] **Discover Page (Multi-level)**:
    - [ ] Level 1/2: Discovery of galleries, products, and events.
- [ ] **Profile Views**: Finalize profile UI and ensure intuitive back-navigation.

### Commerce & Utility
- [ ] **Library (Bookmarks)**: Implement segmented control for Places, Products, and Events.
- [ ] **Cart**: Build the main shopping cart experience.
- [ ] **Pay Page**: Integrate Apple Pay flow (inspired by Simon Grimm/Vadim tutorials).
- [ ] **Gallery & Menu UI**: Implement Google Photos-style gallery/menu (Vadim inspiration).
- [ ] **Settings & Notifications**: Implementation of standard settings and notifications UI.

## 4. Business User Experience

### Business Dashboard
- [ ] **Dashboard Home**: High-level analytics cards and onboarding steps.
- [ ] **Listing Flows**:
    - [ ] Create flows for listing Menus, Products, Places, and Business Profiles.
- [ ] **Mode Switching**: Implement the transition between Regular and Business user modes (Twitch-style or deep link onboarding).

### Management Tools
- [ ] **Order Management**: Develop a mobile-first order management interface.
- [ ] **iPad Optimization**: Explore/implement iPad-specific layout for business order management.
- [ ] **Business Analytics**: Define and implement specific analytics views for different business types (Event Organizer, Venue Owner, Merchant).

## 5. Analytics & Infrastructure
- [ ] **Sentry Integration**: Set up error tracking and reporting.
- [ ] **Product Analytics**: Implement PostHog or Mixpanel for tracking user behavior and product health.
- [ ] **Web Support**: Plan and implement web-compatible versions of the core features.
- [ ] **Backend Development**: (Long-term) Finalize backend systems once frontend patterns are solidified.
