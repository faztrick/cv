<#
Deploy Flutter Web to a public Google Cloud Storage bucket (low-cost).

This builds Flutter Web with API_BASE_URL baked via --dart-define and uploads
`flutter_frontend/build/web/` to a GCS bucket.

Cheapest mode notes:
- Serving directly from GCS is simple and low cost.
- SPA deep links (e.g. /auth) may 404 without a load balancer rewrite.
- HTTPS custom domain typically requires an HTTPS Load Balancer (extra cost).

Usage:
  ./deploy/gcp/deploy_flutter_storage.ps1 -VarsFile ./deploy/gcp/vars.ps1
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$VarsFile
)

if (!(Test-Path $VarsFile)) {
  throw "Vars file not found: $VarsFile"
}

. $VarsFile

function Assert-NotEmpty([string]$Name, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Missing required config: $Name"
  }
}

Assert-NotEmpty "ProjectId" $ProjectId
Assert-NotEmpty "FlutterBucket" $FlutterBucket
Assert-NotEmpty "FlutterApiBaseUrl" $FlutterApiBaseUrl
Assert-NotEmpty "Region" $Region

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$FlutterDir = Join-Path $RepoRoot "flutter_frontend"
$FlutterBuildDir = Join-Path $FlutterDir "build\web"

Write-Host "Using project $ProjectId" -ForegroundColor Cyan

gcloud config set project $ProjectId | Out-Null

gcloud services enable storage.googleapis.com | Out-Null

# Create bucket if missing
Write-Host "Ensuring bucket exists: gs://$FlutterBucket" -ForegroundColor Cyan
$bucketExists = $false
try {
  gcloud storage buckets describe "gs://$FlutterBucket" | Out-Null
  $bucketExists = $true
}
catch {
  $bucketExists = $false
}

if (-not $bucketExists) {
  # Uniform bucket-level access is recommended.
  gcloud storage buckets create "gs://$FlutterBucket" --location=$Region --uniform-bucket-level-access | Out-Null
}

# Make objects publicly readable (test project)
Write-Host "Making bucket objects publicly readable (allUsers:objectViewer)…" -ForegroundColor Yellow
try {
  gcloud storage buckets add-iam-policy-binding "gs://$FlutterBucket" --member="allUsers" --role="roles/storage.objectViewer" | Out-Null
}
catch {
  Write-Host "IAM binding may already exist; continuing." -ForegroundColor DarkYellow
}

# Build Flutter web
Write-Host "Building Flutter web (API_BASE_URL=$FlutterApiBaseUrl)…" -ForegroundColor Cyan

$flutterArgs = @(
  "build", "web", "--release",
  "--dart-define=API_BASE_URL=$FlutterApiBaseUrl"
)

if (-not [string]::IsNullOrWhiteSpace($FlutterAblyApiKey)) {
  $flutterArgs += "--dart-define=ABLY_API_KEY=$FlutterAblyApiKey"
}

if (!(Test-Path $FlutterDir)) {
  throw "Flutter frontend folder not found: $FlutterDir"
}

Push-Location $FlutterDir
flutter @flutterArgs
Pop-Location

# Upload to GCS
Write-Host "Uploading flutter_frontend/build/web to gs://$FlutterBucket …" -ForegroundColor Cyan

if (!(Test-Path $FlutterBuildDir)) {
  throw "Flutter build output not found (did the build fail?): $FlutterBuildDir"
}

gcloud storage rsync -r $FlutterBuildDir "gs://$FlutterBucket"

# Helpful output URL
Write-Host "Done." -ForegroundColor Green
Write-Host "Public URL (simple): https://storage.googleapis.com/$FlutterBucket/index.html" -ForegroundColor Green
Write-Host "Note: deep links like /auth may 404 without an HTTPS Load Balancer rewrite." -ForegroundColor DarkYellow
