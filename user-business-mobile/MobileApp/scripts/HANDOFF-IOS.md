# iOS TestFlight handoff — AUX Mobile (`@ng4corp/aux`)

Mac collaborator runbook for **Rishay**. Ship TestFlight from current **`prod`** / **`testing`** without committing native trees or changing Expo identity.

**Branch flow:** feature → PR into `testing` → promote `testing` → `staging` → `prod` (owner approve). Do not push to `prod` directly. Day-to-day: branch off `testing` (or `prod` tip after fetch). `main` no longer exists.

## Roles

| Who | Day-to-day | Also available |
|-----|------------|----------------|
| **Owner (Windows)** | EAS **Android** (`preview` APK), Expo project `@ng4corp/aux`, env / Firebase file secrets | Cannot Archive iOS locally |
| **Rishay (Mac)** | **Path A (default):** local `expo prebuild` → Xcode Archive → TestFlight (your Apple account) | **Path B:** EAS iOS on Mac workers after Expo invite — `preview-testflight` |

EAS **does** build iOS (cloud Mac workers run `expo prebuild`). Owner uses EAS for Android because they are on Windows. You may use Path A (what you already know) or Path B once invited to `@ng4corp`.

## Identity (do not change without owner)

| Field | Value |
|-------|-------|
| Expo | `owner: ng4corp`, slug `aux`, projectId `3db21201-d159-475f-9a0c-82ca1b345f5c` |
| iOS bundle | `com.galyvant.aux` (Apple team `VNG3LN323R`) |
| Android package | `com.ng4.RNAuth` (owner / EAS only — out of scope for you) |
| Contact | Rishay — `Rishayraj@gmail.com` — GitHub [RishayRajkumar](https://github.com/RishayRajkumar) |

Apple signing can be **your** Developer account. Do **not** create a personal Expo app, rename slug/projectId, or change bundle IDs without coordinating with the owner.

## Anti-patterns (both paths)

Lesson from commit `8e001c` (`implemented ios build`): committing generated `ios/` bloated the owner’s EAS upload (~150MB → ~50MB after ignore rules) and `ios/Aux/` breaks Windows checkouts (`Aux` is a reserved device name).

- **Never commit** `ios/`, `android/`, `Podfile.lock`, `node_modules`
- **Never commit** `GoogleService-Info.plist`, `google-services.json`, `.env`, Apple credentials
- **Do not remove** `.easignore` exclusions (hurts owner Android EAS upload size)
- **Do not mix** UI refactors into an iOS-signing PR
- Local `ios/` on your Mac disk is fine for Path A; **never push** it. Path B never needs a committed `ios/` (EAS generates it on the worker).

## Access checklist

| System | Status | You need |
|--------|--------|----------|
| **GitHub** | Already a collaborator on `NG4Dev/_Aux` | Clone / pull `prod`; open PRs into `testing` |
| **Expo** | Developer invite on [@ng4corp](https://expo.dev/accounts/ng4corp/settings/members) → `Rishayraj@gmail.com` | Path B: accept invite → `eas login` → access `@ng4corp/aux` |
| **Apple** | Your Developer Program | Signing for Path A / EAS iOS |
| **Firebase** | Owner supplies `GoogleService-Info.plist` securely (Path A) | Place file locally (gitignored). Path B uses EAS file env `GOOGLE_SERVICES_PLIST` when configured |
| **Convex / Clerk** | Keys already on project / `eas.json` | Not required to change for a normal TestFlight build |

**Expo (Path B):** Invite sent on `@ng4corp` as **Developer** (pending acceptance as of 2026-09-30). Live project is **`@ng4corp/aux`**. After you accept:

```bash
eas login
eas whoami
cd .../user-business-mobile/MobileApp
eas project:info   # must resolve Aux under @ng4corp/aux (projectId 3db21201-d159-475f-9a0c-82ca1b345f5c)
```

---

## Pull latest

```bash
git clone https://github.com/NG4Dev/_Aux.git   # or fetch if already cloned
cd _Aux
git fetch --prune
git checkout testing && git pull   # day-to-day integration tip
# or: git checkout prod && git pull   # production tip
cd user-business-mobile/MobileApp
npm ci
```

---

## Path A — Local Xcode → TestFlight (default)

Use this if you already Archive in Xcode and upload to App Store Connect.

```bash
# Place GoogleService-Info.plist in MobileApp/ (gitignored) — owner supplies securely
# Local only — never git add ios/
npx expo prebuild --platform ios --clean
# Open ios/*.xcworkspace in Xcode
# Signing team = your Apple account → Product → Archive → Distribute App → App Store Connect / TestFlight
```

Optional: Transporter or `xcodebuild` — same rule: artifacts stay on disk, not in git.

**Analytics env:** For Archive / TestFlight, use a **Release** scheme so `__DEV__` is false. Set `EXPO_PUBLIC_ANALYTICS_ENABLED=true` (see `.env.example`). `EXPO_PUBLIC_ANALYTICS_ALLOW_DEV` is only for Metro/`__DEV__`. Do not commit `.env`.

---

## Path B — EAS iOS → TestFlight (after Expo invite)

EAS runs `expo prebuild` on a **Mac worker**. Do **not** generate and commit `ios/` “to help” EAS.

```bash
eas login
eas whoami          # then confirm access to @ng4corp/aux
eas build --profile preview-testflight --platform ios

# After the build succeeds:
eas submit --profile preview-testflight --platform ios --latest
```

On first iOS build, when prompted to log in to your Apple Developer account → **Yes**. First submit may prompt for `appleId` / `ascAppId` / `appleTeamId` (`submit.preview-testflight` in `eas.json` is `{}` on purpose — do not fill with empty strings).

Profile `preview-testflight` already sets analytics-related `EXPO_PUBLIC_*` env in `eas.json`.

---

## Agent skills sync (keep agents aligned with owner)

Install the same skill packs the owner uses so Cursor agents do not drift. From the `_Aux` repo root (or home for `-g` installs):

```bash
cd /path/to/_Aux

# Expo / EAS (same pack as owner's project `.agents/skills/`) — project-scoped
npx skills add expo/skills --all -y

# Clerk (matches owner global clerk/* skills)
npx skills add clerk/skills --all -g -y

# Stripe
npx skills add stripe/ai@stripe-best-practices -g -y
npx skills add docs.stripe.com@stripe-docs -g -y

# Convex (official agent skills)
npx skills add get-convex/agent-skills --all -g -y

# Discover more skills
npx skills find find-skills
# then: npx skills add <owner/repo@find-skills> -g -y  (use the package the find command prints)
```

Also in **Cursor → Settings → Plugins**, enable the **Convex** plugin so you get the same Convex rules as the owner.

Restart Cursor (or open a new agent chat) after installing. Verify with `npx skills list`.

---

## Chrome DevTools MCP — live Chrome (not headless)

Agents should drive **your normal signed-in Chrome**, not a headless/isolated profile. That way Clarity / GA / Mixpanel session replays match real accounts (Clarity project `ybzh2zkq5t`).

### A. Cursor MCP config

Add to `~/.cursor/mcp.json` (merge into existing `mcpServers`; do not paste unrelated secrets from anyone else's config):

```json
"chrome-devtools": {
  "command": "npx",
  "args": [
    "-y",
    "chrome-devtools-mcp@latest",
    "--autoConnect",
    "--channel=stable"
  ]
}
```

Requires Node LTS + Google Chrome Stable. Do **not** pass `--headless`.

### B. Enable remote debugging on your personal Chrome (Chrome ≥ 144)

1. Fully quit and reopen **Google Chrome** (your normal profile).
2. Open `chrome://inspect/#remote-debugging`.
3. Turn on remote debugging; click **Allow** when Chrome asks about debugging connections.
4. Stay signed into Aux / Clerk / Expo (and any accounts agents will use) so analytics session replays attach to those identities.

### C. Agent workflow

1. Chrome is already running with remote debugging allowed.
2. In Cursor, ask the agent to navigate/test (e.g. web Discover → Beach bars → La Parada). MCP attaches to that live window — same cookies/sessions as manual browsing.
3. When Chrome shows “Allow debugging?”, click **Allow**.

**Fallback** if `--autoConnect` fails — start Chrome with a debug port and point MCP at it (dedicated profile required by Chrome):

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-stable
```

Then use `"args": ["-y", "chrome-devtools-mcp@latest", "--browser-url=http://127.0.0.1:9222"]`. Prefer `--autoConnect` for personal-account Clarity.

**Security:** remote debugging lets local tools control the browser. Do not leave it enabled while browsing unrelated sensitive sites; turn it off when you are done if you prefer.

After an agent-driven session on the live site, owner can confirm a new recording in Clarity.

---

## Smoke test (both paths)

After TestFlight install:

**Discover → Beach bars → La Parada** (merchant `la-parada`, product `patatas-bravas`).

Owner verifies Mixpanel / GA4. You do not need to change analytics event names.

---

## If repo config must change

Open a **small PR into `testing`**. Owner reviews. Never force-push `prod` / `staging` / `testing`. Before push: `git status` must **not** show `ios/` or `android/`.

CI: merges to `testing` / `staging` / `prod` trigger EAS builds via `.github/workflows/eas-build.yml` (needs `EXPO_TOKEN`). On `testing` and `staging`, Android `preview` and iOS `preview-testflight` both run for the same commit; iOS may fail soft until Apple credentials are on EAS.

---

## Files reference

| File | Purpose |
|------|---------|
| `eas.json` | `preview` (Android APK), `preview-testflight` (iOS store + prebuild), `submit.preview-testflight` |
| `.easignore` / `.gitignore` | Exclude `ios/`, `android/`, secrets — keep these |
| `app.json` | slug `aux`, owner `ng4corp`, projectId `3db21201-d159-475f-9a0c-82ca1b345f5c` |
| `.env.example` | Analytics flag docs |

Do **not** commit: `.env`, Apple credentials, Firebase config files, Convex deploy keys.
