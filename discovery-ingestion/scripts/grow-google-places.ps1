param(
    [string]$City = "johannesburg"
)

Set-Location $PSScriptRoot\..

if (-not (Test-Path ".\.venv\Scripts\activate")) {
    Write-Error "Run from discovery-ingestion after: python -m venv .venv && pip install -r requirements.txt"
    exit 1
}

.\.venv\Scripts\activate

Write-Host "Growing google_places catalog for $City (up to GOOGLE_PLACES_MAX_NEW new venues, stop on 429)..." -ForegroundColor Cyan
python -m src.main scrape --city $City --source google_places --incremental --force --no-obsidian-export
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

python -m src.main export-obsidian --city $City
python -m src.main report --city $City
