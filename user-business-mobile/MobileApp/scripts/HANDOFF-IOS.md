# iOS TestFlight handoff — AUX Mobile (`@ng4/aux-app`)

## Native folders (ios/ / android/)

**Do not commit** `ios/` or `android/` — they are gitignored (same as Complete Farmer). EAS runs `expo prebuild` on build workers (Mac for iOS, Linux for Android).

- **Windows devs:** `eas build --profile preview --platform android` — no local native tree needed.
- **Mac helper (Rishay):** `eas build --profile preview-testflight --platform ios` — prebuild runs in EAS; never rely on a committed `ios/` folder.

**Why:** Expo app name `"Aux"` creates an `ios/Aux/` target on prebuild. `Aux` is a **Windows reserved device name**, so checking out a committed `ios/Aux/` tree breaks `git pull` on Windows. Slug is `aux-app` so EAS prebuild uses a safe native project name.

## iOS helper (TestFlight)

| Field | Value |
|-------|-------|
| **Name** | Rishay |
| **Email** | Rishayraj@gmail.com |
| **GitHub** | [RishayRajkumar](https://github.com/RishayRajkumar) |
| **Apple** | Helper's own Developer account (build + submit) |

Helper builds and submits iOS with **their own Apple Developer account**. You keep Convex, Clerk, and Fireworks (API key on Convex).

## Access checklist

| System | Owner action | Helper needs |
|--------|--------------|--------------|
| **GitHub** | Add collaborator on repo with mobile app | Clone + push bundle ID change if needed |
| **Expo** | Invite as **Developer** on [@ng4](https://expo.dev/accounts/ng4/settings/members) | `eas build` / `eas submit` for project `aux-app` (EAS projectId unchanged) |
| **Convex** | Optional â€” only if changing env vars | Not required for build (`FIREWORKS_API_KEY` already on Convex) |
| **Clerk** | Not needed | Publishable key is in `eas.json` |
| **Apple** | Not needed from owner | Helper's own Apple Developer Program ($99/yr) |

### Owner: invite helper

```text
GitHub username: RishayRajkumar
Helper email (Expo invite): Rishayraj@gmail.com
```

**GitHub** (invite on both repos used for hackathon handoff):

```powershell
gh api repos/NG4Dev/_Aux/collaborators/RishayRajkumar -f permission=push
gh api repos/NG4Dev/aux-amd-serving/collaborators/RishayRajkumar -f permission=push
```

Or from repo root:

```powershell
.\user-business-mobile\MobileApp\scripts\invite-ios-helper.ps1 -HelperGitHubUsername RishayRajkumar -HelperEmail Rishayraj@gmail.com
```

**Expo:** [expo.dev/accounts/ng4/settings/members](https://expo.dev/accounts/ng4/settings/members) â†’ Invite â†’ role **Developer** â†’ **Rishayraj@gmail.com**.

---

## Bundle ID

Current in `app.json`:

- **iOS:** `com.galyvant.aux` (Apple team `VNG3LN323R`)
- **Android:** `com.ng4.RNAuth`

Helper uses the committed bundle IDs unless registering a new App Store app on their team.

## Helper runbook

```powershell
# 1. Clone + install
git clone https://github.com/NG4Dev/_Aux.git
cd _Aux/user-business-mobile/MobileApp
npm ci

# 2. Expo (must be invited to @ng4)
eas login
eas whoami   # should show access to @ng4/aux-app

# 3. Build for TestFlight (EAS prebuild on Mac worker — no committed ios/ required)
eas build --profile preview-testflight --platform ios

# 4. Submit to App Store Connect / TestFlight
#    First submit: eas will prompt for appleId, ascAppId, appleTeamId
#    (submit.preview-testflight in eas.json is {} â€” do not use empty strings)
#    Or helper can fill ios fields in eas.json after first App Store Connect app create
eas submit --profile preview-testflight --platform ios --latest

# 5. App Store Connect â†’ TestFlight â†’ External Testing â†’ copy public link
```

On first iOS build, when prompted **â€œLog in to your Apple Developer account?â€** â†’ **Yes**.

---

## What the app talks to (no droplet required for judges)

```text
Phone (APK / TestFlight)
  â†’ Convex (tacit-iguana-891.eu-west-1.convex.cloud)
  â†’ Clerk auth
  â†’ Fireworks Gemma (FIREWORKS_API_KEY on Convex; deployment path in FIREWORKS_MODEL)
```

AMD GPU droplet can stay **off** for judge testing. Demo video shows MI300X path.

---

## Android judges (public APK)

Do **not** share expo.dev build pages â€” they require `@ng4` login.

Use the **GitHub Release** APK (see `aux-amd-serving` releases or `LABLAB_SUBMISSION.md`).

Install: download APK on Android â†’ allow browser to install unknown apps â†’ open Aux.

---

## Verify route (device QA)

Discover â†’ Beach bars â†’ **La Parada** â†’ Chat â†’ *"What tapas do you have?"*

Header should show **Gemma (FW) Â· Agent**. First Fireworks request after idle may take 30â€“60s (GPU cold start).

---

## Files reference

| File | Purpose |
|------|---------|
| `eas.json` | `preview` (Android APK + prebuild), `preview-testflight` (iOS store + prebuild), `submit.preview-testflight` |
| `.gitignore` | `ios/`, `android/` — native code generated at build time only |
| `app.json` | Slug `aux-app`, bundle IDs, EAS projectId `83c8e834-27c8-4681-961c-a40b215cf9a2` |

Do **not** commit: `.env`, Apple credentials, Fireworks secret key, Convex deploy keys.

