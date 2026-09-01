# iOS preview build — MUST run interactively once to sign in with Apple Developer.
# Requires: Apple Developer Program ($99/yr) on the Apple ID you use.
Set-Location $PSScriptRoot\..
Write-Host @"
Starting interactive iOS build (preview profile).

When prompted:
  1. Log in with your Apple Developer Apple ID
  2. Let EAS generate distribution certificate + provisioning profile

For judges with iPhones, prefer TestFlight after this works:
  eas build --profile preview-testflight --platform ios
  eas submit --platform ios --latest
"@
eas build --profile preview --platform ios
