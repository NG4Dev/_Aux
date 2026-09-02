# Starts Metro (USB-friendly --lan) and tees all output to logs/ for agent review.
$ErrorActionPreference = "Continue"

$MobileAppRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $MobileAppRoot "logs"
$LatestLog = Join-Path $LogDir "dev-session-latest.log"
$ArchiveLog = Join-Path $LogDir "dev-telemetry.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-LogLine {
    param([string]$Line)
    $Line | Add-Content -Path $LatestLog -Encoding utf8
    Add-Content -Path $ArchiveLog -Value $Line -Encoding utf8
    Write-Host $Line
}

$sessionHeader = @(
    "",
    "======== DEV SESSION $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K') ========",
    "host: $env:COMPUTERNAME",
    "cwd: $MobileAppRoot",
    "command: npx expo start --dev-client --lan",
    "",
    "--- adb devices ---"
)

Set-Content -Path $LatestLog -Encoding utf8 -Value $sessionHeader
foreach ($line in $sessionHeader) { Add-Content -Path $ArchiveLog -Value $line -Encoding utf8 }

(adb devices 2>&1) | ForEach-Object { Write-LogLine $_ }
Write-LogLine ""
Write-LogLine "--- adb reverse ---"
adb reverse tcp:8081 tcp:8081 2>&1 | ForEach-Object { Write-LogLine $_ }
(adb reverse --list 2>&1) | ForEach-Object { Write-LogLine $_ }
Write-LogLine ""
Write-LogLine "--- metro ---"

Set-Location $MobileAppRoot

Write-Host ""
Write-Host "Telemetry (latest): $LatestLog" -ForegroundColor Cyan
Write-Host "Telemetry (archive): $ArchiveLog" -ForegroundColor DarkGray
Write-Host "Discover logs: Select-String '[DiscoverFlow]' $LatestLog" -ForegroundColor DarkGray
Write-Host "Assistant logs: Select-String '[AssistantFlow]' $LatestLog" -ForegroundColor DarkGray
Write-Host "Connect phone: exp://127.0.0.1:8081" -ForegroundColor Green
Write-Host ""

npx expo start --dev-client --lan 2>&1 | ForEach-Object { Write-LogLine $_ }
