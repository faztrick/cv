[CmdletBinding()]
param(
  [ValidateSet('LinkedInPython', 'LinkedInNode', 'IndeedPython', 'AIHawkPython')]
  [string]$RepoChoice = 'LinkedInPython',

  [string]$BaseDir = 'automation\repos',

  [switch]$ForceReclone
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-Command {
  param([Parameter(Mandatory)][string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  return $null -ne $cmd
}

function Ensure-Directory {
  param([Parameter(Mandatory)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

$workspaceRoot = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$targetRoot = Join-Path $workspaceRoot $BaseDir
Ensure-Directory -Path $targetRoot

$repoMap = @{
  LinkedInPython = @{
    RepoUrl = 'https://github.com/madingess/EasyApplyBot.git'
    DestDir = 'EasyApplyBot'
    ProjectType = 'python'
    RunHint = 'python .\main.py'
  }
  LinkedInNode = @{
    RepoUrl = 'https://github.com/adnanedrief/linkedin-job-apply-automation.git'
    DestDir = 'linkedin-job-apply-automation'
    ProjectType = 'node'
    RunHint = 'node index.js'
  }
  IndeedPython = @{
    RepoUrl = 'https://github.com/meteor314/indeed_bot.git'
    DestDir = 'indeed_bot'
    ProjectType = 'python'
    RunHint = 'python .\indeed_bot.py'
  }
  AIHawkPython = @{
    RepoUrl = 'https://github.com/feder-cr/Jobs_Applier_AI_Agent_AIHawk.git'
    DestDir = 'AIHawkPython'
    ProjectType = 'python'
    RunHint = 'python .\main.py'
  }
}

$selection = $repoMap[$RepoChoice]
$repoUrl = $selection.RepoUrl
$destDir = $selection.DestDir
$projectType = $selection.ProjectType
$runHint = $selection.RunHint

Write-Host "Target: $RepoChoice => $repoUrl" -ForegroundColor Cyan

if (-not (Test-Command -Name 'git')) {
  Write-Warning 'git is not on PATH. Install Git for Windows and re-run. https://git-scm.com/downloads'
  return
}

$destPath = Join-Path $targetRoot $destDir
if (Test-Path -LiteralPath $destPath) {
  if ($ForceReclone) {
    Write-Host "Removing existing folder: $destPath" -ForegroundColor Yellow
    Remove-Item -Recurse -Force -LiteralPath $destPath
  }
  else {
    Write-Host "Repo already present at $destPath" -ForegroundColor Yellow
  }
}

if (-not (Test-Path -LiteralPath $destPath)) {
  Push-Location $targetRoot
  try {
    git clone $repoUrl
  }
  finally {
    Pop-Location
  }
}

if (-not (Test-Path -LiteralPath $destPath)) {
  throw 'Clone failed or target path missing.'
}

Push-Location $destPath
try {
  switch ($projectType) {
    'python' {
      if (-not (Test-Command -Name 'python')) {
        Write-Warning 'python is not on PATH. Install Python 3.10+ and re-run. https://www.python.org/downloads/'
        break
      }

      if (-not (Test-Path -LiteralPath '.\.venv')) {
        Write-Host 'Creating virtual environment (.venv)' -ForegroundColor Cyan
        python -m venv .venv
      }

      $venvActivate = '.\.venv\Scripts\Activate.ps1'
      if (Test-Path -LiteralPath $venvActivate) {
        Write-Host 'Activating venv and installing requirements' -ForegroundColor Cyan
        . $venvActivate
        if (Test-Path -LiteralPath 'requirements.txt') {
          python -m pip install --upgrade pip
          pip install -r requirements.txt
        }
        elseif (Test-Path -LiteralPath 'requirements.yaml') {
          Write-Warning 'Found requirements.yaml. Manually install listed packages or convert to requirements.txt.'
        }
        else {
          Write-Warning 'No requirements.txt found; skipping dependency install.'
        }
      }
      else {
        Write-Warning 'Could not activate venv; .venv activation script not found.'
      }
    }
    'node' {
      if (-not (Test-Command -Name 'node')) {
        Write-Warning 'node is not on PATH. Install Node.js 18+ and re-run. https://nodejs.org/en/download'
        break
      }

      if (Test-Path -LiteralPath 'package-lock.json') {
        npm ci
      }
      elseif (Test-Path -LiteralPath 'package.json') {
        npm install
      }
      else {
        Write-Warning 'No package.json found; skipping npm install.'
      }
    }
  }
}
finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Green
switch ($RepoChoice) {
  'LinkedInPython' {
    Write-Host "1) Edit config.yaml in $destPath (email, password, positions, locations, uploads)."
    Write-Host '2) Run:'
    Write-Host "   cd `"$destPath`"; .\.venv\Scripts\Activate.ps1; $runHint"
  }
  'LinkedInNode' {
     Write-Host '1) Add LINKEDIN_EMAIL and LINKEDIN_PASSWORD to the workspace root .env file.'
     Write-Host '2) Optionally edit data\linkedin-bot-settings.json for keyword/location/pages.'
     Write-Host '3) Run:'
     Write-Host '   .\automation\run-linkedin-bot.ps1'
  }
  'IndeedPython' {
    Write-Host "1) Edit config.yaml in $destPath (base_url, language, user_data_dir)."
    Write-Host '2) Ensure profile and CV are configured in Indeed.'
    Write-Host '3) Run:'
    Write-Host "   cd `"$destPath`"; .\.venv\Scripts\Activate.ps1; $runHint"
  }
  'AIHawkPython' {
    Write-Host "1) Review the AIHawk configuration files in $destPath and keep credentials out of git."
    Write-Host '2) Run:'
    Write-Host "   cd `"$destPath`"; .\.venv\Scripts\Activate.ps1; $runHint"
  }
}

Write-Host ''
Write-Host 'Notes:' -ForegroundColor Green
Write-Host '- These tools may violate site ToS; use responsibly.'
Write-Host '- Expect CAPTCHAs; you may need to solve them manually.'
Write-Host '- Prefer running in non-headless mode until stable.'
