# Aux Project Roadmap & Tasks

This roadmap is based on voice transcripts from March 10-11, 2026, outlining the enhancements and features for the Aux application.

## 1. Authentication & Onboarding Enhancements

### Create Account & Sign-In Flow
- [ ] **Advanced Error Handling**:
    - [ ] Implement succinct Toast notifications at the bottom for Clerk errors.
    - [ ] Include error codes and clear messages in Toasts (handled by Clerk).
    - [ ] Add a "Fix It" text button in the Toast to route the user back to the specific step (e.g., email or password page).
    - [ ] Ensure routing allows resuming the multi-step flow from the failed page rather than restarting (should not pick up as beginning of sequence).
- [ ] **Magic Link & Deep Linking**:
    - [x] Complete frontend implementation of Clerk Magic Link sign-in.
    - [ ] **FIX**: Investigate and fix routing bug where navigating to Library after Magic Link login redirects to the splash screen.
- [ ] **Google Sign-In Cleanup**:
    - [ ] Fix "Unmatched Route" flash during Google SSO.
    - [ ] Ensure correct post-login redirection logic:
        - [ ] Check if user has seen onboarding/Apple invite flow/preference collection.
        - [ ] If not seen: show Onboarding -> Apple Invites -> Preference Collection -> Notifications -> Feed.
        - [ ] If already seen: take directly to the Feed.

### Post-Auth Password & Onboarding Details
- [ ] **Post-Auth Password Setup**: Implement the flow to set a password if a user logs in via Magic Link for the first time.
- [ ] **Visual Overhaul**:
    - [ ] Update all images, logos, and copy on the splash screen and auth pages.
    - [ ] Change images on the icon page (first initial page).
    - [ ] Update videos on sign-up and sign-in pages.
- [ ] **Apple Invites Onboarding**:
    - [ ] Implement the "scrolling video" effect (retrofit from reference volume/Vadim project).
- [ ] **Twitter Preferences Collection**: Build the preferences selection screen.
- [ ] **Notification Step**: Position the notification request at the end of the onboarding sequence (or test Notifications first -> Onboarding second).

## 2. User Interface & Product Tour

### Gestures & Navigation
- [ ] **Gesture Onboarding**: Create interactive screens explaining app gestures.
    - [ ] Swiping on the feed.
    - [ ] Swipe right/left gestures for AI chat.
- [ ] **AI Chat Integration**:
    - [ ] Finalize placement: Nav bar like Grok (X) vs. Swipe-left-for-AI (like Instagram story camera).
    - [ ] Adjust or disable system gestures (e.g., double swipe left to exit) that conflict with app-specific swipes.
- [ ] **Navigation Cleanup**:
    - [ ] Fix "slide back to exit" glitches on main tabs.
    - [ ] Fix routing when going Library -> Home -> Discover -> Library -> Pay -> Home.

### Interactive Product Tours (Gmail-style)
- [ ] **Page-Specific Tours**: Overlay tours for Home, Notifications, Discovery, Nav bar, etc. Gmail-style Tours Implement overlay tours for first-time visitors.
- [ ] **Tour Logic**:
    - [ ] Trigger only when user visits for the first time.
    - [ ] Track completion/dismissal in database.
    - [ ] Implement granular analytics to track how far user has gone.

## 3. Core App Features (Regular User)

### Dashboard & Discovery
- [ ] **Home Dashboard**:
    - [ ] Implement "Perplexity style feed" for the main home view.
    - [ ] Expanded views when clicking items (products, places, events).
- [ ] **Discover Page**:
    - [ ] Multi-level discovery (Galleries, Products, Events).
    - [ ] Level 1/2: Finding galleries or specific products/events.
- [ ] **Library**: Refine and finalize UI for bookmarks using a segmented control (Places, Products, Events).

### Wallet & Payments
- [ ] **Wallet Interface**:
    - [ ] Land on Pay screen with Balance, Wallet, Sent, Send & Pay, and History.
    - [ ] **Wallet View**: Clean up routing for topping up and dropping back to balance view.
    - [ ] **Send & Pay**: Implementation not yet done; needs payment logic.
    - [ ] **History**: View recent transactions (Vadim Google Photos style gallery/menu).
- [ ] **Payment UI**:
    - [ ] Integrate Apple Pay flow (Simon Grimm/Vadim inspiration).
    - [ ] **Cards View**: Implement section to see stored payment methods.
- [ ] **Future Wallet Settings**: Statements, adding payment methods, auto top-up, security/PIN settings.
### Commerce & Utility
- [ ] **Library (Bookmarks)**: Implement segmented control for Places, 
Products, and Events.
- [ ] **Cart**: Build the main shopping cart experience.
- [ ] **Pay Page**: Integrate Apple Pay flow (inspired by Simon Grimm/Vadim 
tutorials).
- [ ] **Gallery & Menu UI**: Implement Google Photos-style gallery/menu (Vadim 
inspiration).
- [ ] **Settings & Notifications**: Implementation of standard settings and 
notifications UI.
### UI Polish
- [ ] **Navbar Enhancement**:
    - [ ] Implement a five-button navbar.
    - [ ] Apply high-quality blur effect (get reference from News store app).

## 4. Business User Experience

### Business Dashboard
- [ ] **Dashboard Home**: High-level analytics cards and onboarding steps.
- [ ] **Listing Flows**: Flows for listing Menus, Products, Places, Business Profiles, Venue listing, Event organizing (with artists/merchants).
- [ ] **Mode Switching**: Implement transition between Regular and Business user modes (Twitch-style or deep link onboarding).

### Management Tools
- [ ] **Order Management**: Develop a mobile-first order management interface.
- [ ] **iPad Optimization**: Explore/implement iPad-specific layout for business order management.
- [ ] **Business Analytics**: Define specific analytics for different business types Event Organizers, Venue Owners, and Merchants.

## 5. Analytics & Infrastructure
- [ ] **Sentry Integration**: Set up error tracking and reporting.
- [ ] **Product Analytics**: Implement PostHog or Mixpanel (avoiding Amplitude/Product Fruits for now).
- [ ] **Web Support**: Plan and implement web-compatible versions of core features.
- [ ] **Backend Development**: Finalize backend systems once frontend patterns are solidified.
