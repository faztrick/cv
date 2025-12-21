$ProjectId = "carbon-airlock-426814-n3"
$Region = "us-central1"

# Cloud Run Service Names
$ApiService = "cv-api"
$WebService = "cv-web"

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

# Web Config
$NextPublicApiUrl = "https://$ApiService-$ProjectId.$Region.run.app" # Approximate, will be updated after API deploy if needed, but Cloud Run URLs are predictable-ish if we knew the hash. Actually we don't.
# Better strategy: Deploy API first, get URL, update this.
# For now, we'll leave it as a placeholder or try to predict it.
# Actually, Cloud Run URLs are `service-name-hash-uc.a.run.app`. We can't predict the hash easily.
# The deploy script might need to handle this dependency.
# Let's look at deploy.ps1 again. It deploys API, then Web.
# But Web needs API URL at build time.
# So we must deploy API, get URL, then build Web.
# The current deploy.ps1 does:
# 1. Build API & Web images (in parallel or sequence)
# 2. Deploy API
# 3. Deploy Web
# This is a problem if Web needs API URL at build time.
# I will need to modify deploy.ps1 to split the build process if I want to inject the real URL.
# OR, for the first run, we deploy API, get URL, then re-deploy Web.

# Flutter Config
$FlutterBucket = "carbon-airlock-426814-n3-flutter-web"
$FlutterApiBaseUrl = "https://$ApiService-hash-uc.a.run.app" # Placeholder, needs update after API deploy
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
