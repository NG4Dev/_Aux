## Description

This PR consolidates the implementation of a high-performance, multi-step Sign-Up flow featuring a custom-built Date of Birth wheel picker. The primary focus was on achieving native-level smoothness and resolving critical stability issues in the virtualized lists used for date selection.

### Key Achievements:
- **High-Performance Wheel Picker**: Overhauled the DOB selector with GPU-accelerated highlighting. Used `Animated` interpolations to decouple visual feedback from the React render cycle, enabling buttery-smooth 120fps scrolling even with 100+ items (Years).
- **Stability Logic**: Implemented strict interaction guards and `currentSelection` ref tracking to eliminate "scroll-fighting" loops and the "December Trap" (sticky list boundaries).
- **Defensive Date Handling**: Integrated smart clamping for date transitions (e.g., automatically jumping from March 31st to February 28th when switching months) to prevent invalid state.
- **Figma-Accurate UI**: Developed the multi-step flow (Email -> Password -> DOB -> Name) with integrated progress indicators, custom inputs, and optimized keyboard-avoiding behavior.
- **Clerk Integration**: Hooked up the flow to Clerk for user creation and email verification prep.

Fixes # (Stability & Performance issues in DOB Picker)

## Type of change

- [x] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## How Has This Been Tested?

- [x] **Stress Test**: Flicked the Year column (100+ items) at high velocity to ensure no "VirtualizedList" slow update warnings or UI freezes.
- [x] **Boundary Test**: Verified smooth transitions at the start and end of all wheel lists (January, December, 2026, 1926).
- [x] **Date Logic Test**: Confirmed correct clamping when switching between months with different day counts (e.g., 31 -> 30 -> 28).
- [x] **Keyboard Test**: Verified that footer buttons remain accessible and the layout adjusts correctly when the keyboard is summoned.

**Test Configuration**:
* Hardware: iOS Simulator (iPhone 15), Android Emulator (Pixel 7)
* Toolchain: Expo SDK 50+
* SDK: Clerk Expo SDK

## Checklist:

- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes
- [x] Any dependent changes have been merged and published in downstream modules

### Migrations

- [x] This PR requires a "Data Migration" (Clerk Metadata structure).
- [x] I have updated the code to handle the new `unsafeMetadata` structure for DOB.
*Note: This refers to the structured storage of Date of Birth in Clerk's user metadata, rather than a traditional SQL migration.*
