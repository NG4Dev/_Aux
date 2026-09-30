# Owner-only: invite iOS helper before they start HANDOFF-IOS.md runbook.
# Fill in placeholders, then run from repo root.

param(
  [Parameter(Mandatory = $true)]
  [string]$HelperGitHubUsername,

  [Parameter(Mandatory = $true)]
  [string]$HelperEmail
)

Write-Host "Inviting GitHub collaborator: $HelperGitHubUsername on NG4Dev/_Aux and NG4Dev/aux-amd-serving (push)..."
gh api --method PUT "repos/NG4Dev/_Aux/collaborators/$HelperGitHubUsername" -f permission=push
gh api --method PUT "repos/NG4Dev/aux-amd-serving/collaborators/$HelperGitHubUsername" -f permission=push

Write-Host ""
Write-Host "Expo invite (manual — Path B EAS iOS):"
Write-Host "  Org: @ng4corp (not personal @ng4dev — personal accounts cannot Invite)"
Write-Host "  1. Open https://expo.dev/accounts/ng4corp/settings/members"
Write-Host "  2. Invite $HelperEmail as Developer"
Write-Host "  3. Project lives at @ng4corp/aux (owner ng4corp in app.json)"
Write-Host "  4. Helper: eas login && eas whoami — must access @ng4corp/aux"
Write-Host ""
Write-Host "Send helper: user-business-mobile/MobileApp/scripts/HANDOFF-IOS.md"
