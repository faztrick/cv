# ============================================
# 🛡️ SAFE JOB APPLICATION LAUNCHER
# Anti-Ban Strategy for LinkedIn & Indeed
# ============================================
# Muhammed Fasil PV - UAE Job Search
# ============================================

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║         🛡️  SAFE JOB APPLICATION AUTOMATION                  ║
║              Anti-Ban Mode Enabled                            ║
╠══════════════════════════════════════════════════════════════╣
║  This launcher runs bots with SAFE settings:                 ║
║  • Random delays between actions                              ║
║  • Low volume (max 10-20 applications per session)           ║
║  • Stealth mode (anti-detection)                              ║
║  • Session persistence (fewer logins)                         ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Available Bots:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [1] LinkedIn SAFE Bot (Node.js) - RECOMMENDED" -ForegroundColor Green
Write-Host "      - Uses stealth plugin"
Write-Host "      - Random delays 2-10 seconds"
Write-Host "      - Max 10 applications per session"
Write-Host ""
Write-Host "  [2] LinkedIn EasyApplyBot (Python)" -ForegroundColor Yellow
Write-Host "      - Full-featured with AI answers"
Write-Host "      - Auto-fill all fields"
Write-Host "      - Requires Chrome + credentials"
Write-Host ""
Write-Host "  [3] Indeed Bot (Python)" -ForegroundColor Magenta
Write-Host "      - Uses Camoufox (anti-detection)"
Write-Host "      - UAE Indeed configured"
Write-Host "      - Max 20 applications"
Write-Host ""
Write-Host "  [4] View All Configs" -ForegroundColor Cyan
Write-Host "  [5] Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Select option (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Starting LinkedIn SAFE Bot..." -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Add your credentials to config.json first!" -ForegroundColor Yellow
        Write-Host ""

        $configPath = "I:\projects\cv\automation\repos\linkedin-job-apply-automation\config.json"
        $config = Get-Content $configPath | ConvertFrom-Json

        if ($config.email -eq "YOUR_LINKEDIN_EMAIL_HERE") {
            Write-Host "❌ Please edit config.json with your LinkedIn credentials first!" -ForegroundColor Red
            Write-Host "   File: $configPath" -ForegroundColor Yellow
            notepad $configPath
        } else {
            Write-Host "✅ Credentials found. Starting bot..." -ForegroundColor Green
            Set-Location "I:\projects\cv\automation\repos\linkedin-job-apply-automation"
            node index-safe.js
        }
    }
    "2" {
        Write-Host "`n🚀 Starting LinkedIn EasyApplyBot..." -ForegroundColor Yellow
        Write-Host "⚠️  IMPORTANT: Add your credentials to config.yaml first!" -ForegroundColor Yellow
        Write-Host ""

        Set-Location "I:\projects\cv\automation\repos\EasyApplyBot"

        $configPath = "I:\projects\cv\automation\repos\EasyApplyBot\config.yaml"
        $config = Get-Content $configPath -Raw

        if ($config -match "YOUR_LINKEDIN_EMAIL_HERE") {
            Write-Host "❌ Please edit config.yaml with your LinkedIn credentials first!" -ForegroundColor Red
            Write-Host "   File: $configPath" -ForegroundColor Yellow
            notepad $configPath
        } else {
            Write-Host "✅ Config found. Starting bot..." -ForegroundColor Green
            python main.py
        }
    }
    "3" {
        Write-Host "`n🚀 Starting Indeed Bot..." -ForegroundColor Magenta
        Write-Host "⚠️  You may need to log in manually the first time" -ForegroundColor Yellow
        Write-Host ""

        Set-Location "I:\projects\cv\automation\repos\indeed_bot"
        python indeed_bot.py
    }
    "4" {
        Write-Host "`n📁 Config Files:" -ForegroundColor Cyan
        Write-Host "   LinkedIn Node: I:\projects\cv\automation\repos\linkedin-job-apply-automation\config.json"
        Write-Host "   LinkedIn Python: I:\projects\cv\automation\repos\EasyApplyBot\config.yaml"
        Write-Host "   Indeed: I:\projects\cv\automation\repos\indeed_bot\config.yaml"
        Write-Host ""
        Write-Host "Opening all configs..." -ForegroundColor Yellow
        notepad "I:\projects\cv\automation\repos\linkedin-job-apply-automation\config.json"
        Start-Sleep -Seconds 1
        notepad "I:\projects\cv\automation\repos\EasyApplyBot\config.yaml"
        Start-Sleep -Seconds 1
        notepad "I:\projects\cv\automation\repos\indeed_bot\config.yaml"
    }
    "5" {
        Write-Host "`nGoodbye! Good luck with your job search! 🍀" -ForegroundColor Green
        exit
    }
    default {
        Write-Host "Invalid option. Please run again." -ForegroundColor Red
    }
}

Write-Host "`n"
Write-Host "=" * 60
Write-Host "📋 ANTI-BAN TIPS:" -ForegroundColor Yellow
Write-Host "=" * 60
Write-Host @"
  1. Run only ONCE per day (morning 8-10 AM best)
  2. Watch the first 5 applications manually
  3. Solve any CAPTCHAs immediately
  4. Don't run multiple bots at the same time
  5. Wait 2-3 hours between sessions
  6. Keep applications under 20/day total
  7. Review applied jobs weekly on LinkedIn/Indeed
"@
Write-Host ""
