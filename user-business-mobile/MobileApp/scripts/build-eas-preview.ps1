# Build standalone preview APK for hackathon judges (requires: eas login)
# Judges install the APK from the expo.dev link — your PC does NOT need to stay on.
Set-Location $PSScriptRoot\..
Write-Host "Building EAS preview profile (embedded JS + Gemma default)..."
eas build --profile preview --platform android --non-interactive --freeze-credentials
Write-Host @"

When the build finishes:
  1. Open the build URL from expo.dev and share the APK install link.
  2. Judges install on Android — no Metro, no dev PC required.
  3. App talks to Convex cloud + Fireworks (Gemma) for assistant answers.

Before building, ensure Fireworks key is on Convex:
  ..\..\user-business-web\scripts\set-fireworks-convex.ps1 -ApiKey <your-key>
"@
