# Sign-in Flow Tracking

This document tracks the progress of the sign-in flow refactor and its associated features.

## Branch Goals
- Refactor `sign-in.tsx` to a multi-step experience matching Figma design.
- Implement Clerk Magic Link support.
- Integrate "You're in!" post-auth screen.
- Implement "Create a password" reset/setup flow.
- Finalize onboarding with notifications.

## Progress Checklist
- [x] Configure Clerk MCP in `.vscode/mcp.json`
- [x] Create tracking documentation
- [x] Clean up merge conflicts in `sign-up.tsx` and `sign-in.tsx`
- [x] Refactor `sign-in.tsx` to multi-step logic (Email -> Password/Magic Link)
- [x] Implement magic link sign-in and "You're in!" screen
- [x] Implement "Create a password" reset/setup flow
- [x] Implement conditional redirect to `notifications.tsx`
- [x] Update UI to match Figma design (dark theme, keyboard-aware buttons)
- [x] Clean up merge conflicts in all auth components and layouts
- [x] Restore missing dependencies in `package.json`
- [ ] Implement advanced error handling with Toasts and "Go to page" logic
- [ ] Implement onboarding sequencing (Notifications vs Onboarding vs Preferences)
- [ ] Update onboarding images, logos, and copy
- [ ] Implement gesture onboarding for AI chat (swipe right)
- [ ] Implement interactive product tours (Gmail-style)
- [ ] Finalize business user dashboard and listing flows


## Notes
- Sign-in Step 1: Capture Email.
- Sign-in Step 2: Password OR Magic Link.
- "You're in!" Screen: Post-auth choices (Remember device, Set password, Skip).
- Create Password Screen: Reusable for reset/setup.
