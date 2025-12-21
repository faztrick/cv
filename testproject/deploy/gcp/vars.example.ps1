<#
Copy this file to vars.ps1 and fill in values.
Then run:
  ./deploy/gcp/deploy.ps1 -VarsFile ./deploy/gcp/vars.ps1

This script is designed for Windows PowerShell and assumes you have `gcloud` installed.
#>

$ProjectId = "YOUR_GCP_PROJECT_ID"
$Region = "us-central1"

# Cloud Run service names
$ApiService = "fanhouse-api"
$WebService = "fanhouse-web"

# Container images (use Artifact Registry or gcr.io). Examples:
#  - "$Region-docker.pkg.dev/$ProjectId/fanhouse/fanhouse-api:latest"
#  - "gcr.io/$ProjectId/fanhouse-api:latest"
$ApiImage = "gcr.io/$ProjectId/fanhouse-api:latest"
$WebImage = "gcr.io/$ProjectId/fanhouse-web:latest"

# Cloud SQL connection name: PROJECT:REGION:INSTANCE
$CloudSqlInstanceConnectionName = "PROJECT:REGION:INSTANCE"

# Runtime env vars for API
# IMPORTANT: WEB_ORIGIN can be a comma-separated allowlist.
$JwtSecret = "CHANGE_ME"
$WebOrigin = "https://YOUR_NEXTJS_OR_FLUTTER_WEB_ORIGIN"

# Prisma DATABASE_URL for Cloud Run + Cloud SQL socket
# Example:
# postgresql://USER:PASSWORD@localhost:5432/DB?host=/cloudsql/PROJECT:REGION:INSTANCE&schema=public
$DatabaseUrl = "postgresql://USER:PASSWORD@localhost:5432/DB?host=/cloudsql/$CloudSqlInstanceConnectionName&schema=public"

# Next.js build-time public API URL
$NextPublicApiUrl = "https://YOUR_API_CLOUD_RUN_URL"

# Optional
$AblyApiKey = ""  # leave empty to disable realtime
$SubscriptionPriceCents = "1200"

# Whether to allow unauthenticated access to web/api Cloud Run services
$AllowUnauthenticated = $true

# -------------------------
# Cost-optimized defaults
# -------------------------
# For a test project, keep Cloud Run small and prevent surprise scaling.
# You can raise these later if needed.

# API Cloud Run sizing
$ApiCpu = "1"
$ApiMemory = "512Mi"
$ApiMinInstances = "0"
$ApiMaxInstances = "1"

# Web Cloud Run sizing
$WebCpu = "1"
$WebMemory = "512Mi"
$WebMinInstances = "0"
$WebMaxInstances = "1"

# DB init job sizing
$DbJobCpu = "1"
$DbJobMemory = "512Mi"

# -------------------------
# Flutter Web (Cloud Storage)
# -------------------------
# If you want the lowest-cost hosting without a load balancer, you can upload
# Flutter Web static files to a public GCS bucket.
# Note: deep-link SPA routing and custom HTTPS domains usually require a Load
# Balancer (extra cost). For cheapest, use the storage URL.

$FlutterBucket = ""  # e.g. "$ProjectId-fanhouse-flutter-web"
$FlutterApiBaseUrl = ""  # e.g. "https://YOUR_API_CLOUD_RUN_URL"
$FlutterAblyApiKey = ""  # optional
