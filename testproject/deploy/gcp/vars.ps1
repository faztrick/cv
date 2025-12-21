$ProjectId = "carbon-airlock-426814-n3"
$Region = "us-central1"

# Cloud Run Service Names
$ApiService = "cv-api"
$WebService = "cv-web"

# Container images (Artifact Registry / GCR)
$ApiImage = "gcr.io/$ProjectId/cv-api:latest"
$WebImage = "gcr.io/$ProjectId/cv-web:latest"

# Cloud SQL Config
# We will create this instance if it doesn't exist
$CloudSqlInstanceName = "cv-db-test"
$CloudSqlInstanceConnectionName = "$ProjectId`:$Region`:$CloudSqlInstanceName"
$DbUser = "postgres"
$DbPassword = "SuperSecretPassword123!" # CHANGE THIS for production
$DbName = "cv_db"

# Database URL for Prisma (socket connection for Cloud Run)
# Format: postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/CONNECTION_NAME
$DatabaseUrl = "postgresql://$($DbUser):$($DbPassword)@localhost/$($DbName)?host=/cloudsql/$($CloudSqlInstanceConnectionName)"

# JWT Secret
$JwtSecret = "change-me-to-something-secure-in-production"

# CORS allowlist (comma-separated). Start with local + GCS; we'll append the web URL after deploy.
$WebOrigin = "http://localhost:3000,https://storage.googleapis.com"

# Optional subscription price (cents)
$SubscriptionPriceCents = "0"

# Web Config (deploy script will resolve API URL after API deploy)
$NextPublicApiUrl = ""

# Flutter Config (fill FlutterApiBaseUrl after API deploy)
$FlutterBucket = "carbon-airlock-426814-n3-flutter-web"
$FlutterApiBaseUrl = ""
$FlutterAblyApiKey = ""

# Cost / Scaling Config (Test Project Defaults)
$ApiMinInstances = 0
$ApiMaxInstances = 1
$ApiCpu = "1"
$ApiMemory = "512Mi"

$WebMinInstances = 0
$WebMaxInstances = 1
$WebCpu = "1"
$WebMemory = "512Mi"

$DbJobCpu = "1"
$DbJobMemory = "512Mi"
