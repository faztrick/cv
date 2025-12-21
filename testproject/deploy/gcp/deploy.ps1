<#
Deploy API + Web to Cloud Run (GCP) and run a DB init job.

- Builds images via Cloud Build using configs in deploy/gcp/
- Deploys Cloud Run services
- Creates (or updates) a Cloud Run Job that runs Prisma db push + seed

Prereqs:
- gcloud installed and authenticated
- Cloud Run / Cloud Build / Cloud SQL Admin APIs enabled

Usage:
  ./deploy/gcp/deploy.ps1 -VarsFile ./deploy/gcp/vars.ps1

Notes:
- Web requires NEXT_PUBLIC_API_URL at build time.
- API CORS allowlist is configured via WEB_ORIGIN (comma-separated).
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
Assert-NotEmpty "Region" $Region
Assert-NotEmpty "ApiService" $ApiService
Assert-NotEmpty "WebService" $WebService
Assert-NotEmpty "ApiImage" $ApiImage
Assert-NotEmpty "WebImage" $WebImage
Assert-NotEmpty "CloudSqlInstanceConnectionName" $CloudSqlInstanceConnectionName
Assert-NotEmpty "DatabaseUrl" $DatabaseUrl
Assert-NotEmpty "JwtSecret" $JwtSecret
Assert-NotEmpty "WebOrigin" $WebOrigin
Assert-NotEmpty "NextPublicApiUrl" $NextPublicApiUrl

# Optional cost knobs (defaults are OK if unset)
if ([string]::IsNullOrWhiteSpace($ApiCpu)) { $ApiCpu = "1" }
if ([string]::IsNullOrWhiteSpace($ApiMemory)) { $ApiMemory = "512Mi" }
if ([string]::IsNullOrWhiteSpace($ApiMinInstances)) { $ApiMinInstances = "0" }
if ([string]::IsNullOrWhiteSpace($ApiMaxInstances)) { $ApiMaxInstances = "1" }

if ([string]::IsNullOrWhiteSpace($WebCpu)) { $WebCpu = "1" }
if ([string]::IsNullOrWhiteSpace($WebMemory)) { $WebMemory = "512Mi" }
if ([string]::IsNullOrWhiteSpace($WebMinInstances)) { $WebMinInstances = "0" }
if ([string]::IsNullOrWhiteSpace($WebMaxInstances)) { $WebMaxInstances = "1" }

if ([string]::IsNullOrWhiteSpace($DbJobCpu)) { $DbJobCpu = "1" }
if ([string]::IsNullOrWhiteSpace($DbJobMemory)) { $DbJobMemory = "512Mi" }

Write-Host "Using project $ProjectId in region $Region" -ForegroundColor Cyan

gcloud config set project $ProjectId | Out-Null

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com | Out-Null

# 1) Build + push API image
Write-Host "Building API image: $ApiImage" -ForegroundColor Cyan

gcloud builds submit . --config deploy/gcp/cloudbuild.api.yaml --substitutions=_IMAGE=$ApiImage

# 2) Deploy API service
Write-Host "Deploying API Cloud Run service: $ApiService" -ForegroundColor Cyan

$apiDeployArgs = @(
  "run", "deploy", $ApiService,
  "--image", $ApiImage,
  "--region", $Region,
  "--platform", "managed",
  "--port", "8080",
  "--cpu", $ApiCpu,
  "--memory", $ApiMemory,
  "--min-instances", $ApiMinInstances,
  "--max-instances", $ApiMaxInstances,
  "--set-env-vars", "DATABASE_URL=$DatabaseUrl,JWT_SECRET=$JwtSecret,WEB_ORIGIN=$WebOrigin,SUBSCRIPTION_PRICE_CENTS=$SubscriptionPriceCents",
  "--add-cloudsql-instances", $CloudSqlInstanceConnectionName
)

if (-not [string]::IsNullOrWhiteSpace($AblyApiKey)) {
  $apiDeployArgs += "--set-env-vars"
  $apiDeployArgs += "ABLY_API_KEY=$AblyApiKey"
}

if ($AllowUnauthenticated) {
  $apiDeployArgs += "--allow-unauthenticated"
}

gcloud @apiDeployArgs

# 3) Create/update Cloud Run Job for DB init
# Re-uses the API image so Prisma CLI and seed script are available.
$jobName = "$ApiService-db-init"
Write-Host "Creating/updating Cloud Run Job: $jobName" -ForegroundColor Cyan

$jobArgs = @(
  "run", "jobs", "deploy", $jobName,
  "--image", $ApiImage,
  "--region", $Region,
  "--cpu", $DbJobCpu,
  "--memory", $DbJobMemory,
  "--set-env-vars", "DATABASE_URL=$DatabaseUrl",
  "--add-cloudsql-instances", $CloudSqlInstanceConnectionName,
  "--command", "bash",
  "--args", "-lc",
  "--args", "npm run db:deploy && npm run db:seed"
)

gcloud @jobArgs

Write-Host "Running DB init job (schema push + seed)…" -ForegroundColor Cyan

gcloud run jobs execute $jobName --region $Region --wait

# 4) Build + push Web image (requires build-time NEXT_PUBLIC_API_URL)
Write-Host "Building Web image: $WebImage (NEXT_PUBLIC_API_URL=$NextPublicApiUrl)" -ForegroundColor Cyan

gcloud builds submit . --config deploy/gcp/cloudbuild.web.yaml --substitutions=_IMAGE=$WebImage, _NEXT_PUBLIC_API_URL=$NextPublicApiUrl

# 5) Deploy Web service
Write-Host "Deploying Web Cloud Run service: $WebService" -ForegroundColor Cyan

$webDeployArgs = @(
  "run", "deploy", $WebService,
  "--image", $WebImage,
  "--region", $Region,
  "--platform", "managed",
  "--port", "8080",
  "--cpu", $WebCpu,
  "--memory", $WebMemory,
  "--min-instances", $WebMinInstances,
  "--max-instances", $WebMaxInstances
)

if ($AllowUnauthenticated) {
  $webDeployArgs += "--allow-unauthenticated"
}

gcloud @webDeployArgs

Write-Host "Done." -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Green
Write-Host "- Update API WEB_ORIGIN to include your deployed web origins (Next.js and/or Flutter Web)." -ForegroundColor Green
Write-Host "- If you deploy Flutter Web, build it with --dart-define=API_BASE_URL=<your API URL>." -ForegroundColor Green
