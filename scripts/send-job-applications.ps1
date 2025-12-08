# Job Application Email Sender Script
# Opens Gmail compose windows with pre-filled application emails
# Run this script and login to your Gmail in the browser

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  JOB APPLICATION EMAIL SENDER" -ForegroundColor Cyan
Write-Host "  For: Muhammed Fasil PV" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to open Gmail compose with pre-filled content
function Open-GmailCompose {
    param(
        [string]$To,
        [string]$Subject,
        [string]$Body
    )

    # URL encode the parameters
    $encodedSubject = [System.Uri]::EscapeDataString($Subject)
    $encodedBody = [System.Uri]::EscapeDataString($Body)

    $url = "https://mail.google.com/mail/?view=cm&fs=1&to=$To&su=$encodedSubject&body=$encodedBody"

    Start-Process $url
    Write-Host "  Opened compose window for: $To" -ForegroundColor Green
}

# ============================================
# JOB APPLICATION 1: TCS Flutter Developer
# ============================================
Write-Host ""
Write-Host "[1/3] TCS Flutter Developer Application" -ForegroundColor Yellow
Write-Host "  Recruiter: Deepali Upadhyay (TCS MEA Talent Acquisition)" -ForegroundColor White

$tcsSubject = "Application for Flutter Developer Position - Dubai, UAE | 10+ Years Experience"
$tcsBody = @"
Dear Ms. Deepali Upadhyay,

I am writing to apply for the Flutter Developer position at Tata Consultancy Services in Dubai, which I found on LinkedIn.

With 10+ years of software development experience and 4+ years specifically in Flutter/Dart development, I am confident I can make valuable contributions to your team.

KEY QUALIFICATIONS:
- Production Flutter apps: IdolMEA ERP (50+ GCC branches), IdolQueue (i-QMS)
- State Management: Provider, Riverpod, BLoC patterns
- Backend Integration: REST APIs, GraphQL, Firebase, WebSocket
- AI Integration: LangChain, OpenAI, YOLO object detection
- Currently in Dubai with valid UAE Work Visa
- Available for immediate start

RECENT ACHIEVEMENT:
Showcased AI Self-Checkout Kiosk at Gitex Dubai 2024 featuring Flutter frontend with YOLO-powered detection.

I would welcome the opportunity to discuss how my expertise can contribute to TCS's success.

Best regards,
Muhammed Fasil PV
+971 555923545
faztrick@gmail.com
https://linkedin.com/in/faztrick
https://www.uaecodes.com
"@

# ============================================
# JOB APPLICATION 2: Emirates Senior Software Engineer - AI
# ============================================
Write-Host ""
Write-Host "[2/3] Emirates Senior Software Engineer - AI Application" -ForegroundColor Yellow
Write-Host "  Company: Emirates Group (World's Largest International Airline)" -ForegroundColor White

$emiratesSubject = "Application for Senior Software Engineer - AI | Emirates Group | 10+ Years Experience"
$emiratesBody = @"
Dear Emirates Group IT Recruitment Team,

I am writing to apply for the Senior Software Engineer - AI position at Emirates Group, as advertised on LinkedIn.

With 10+ years of software engineering experience and specialized expertise in AI/ML integration, I am excited about the opportunity to contribute to the world's largest international airline.

WHY I'M A PERFECT FIT:

AI/ML Expertise:
- LangChain, LangGraph for agentic AI workflows
- OpenAI API integration for enterprise systems
- YOLO for real-time computer vision
- Whisper and ElevenLabs for voice AI
- TensorFlow model deployment

Enterprise Software:
- IdolMEA ERP: Deployed to 50+ branches across GCC
- Full-stack: React.js, Node.js, Python, Flutter
- Agile/Scrum methodology, CI/CD pipelines

AVAILABILITY:
- Location: Dubai, UAE (currently based here)
- Work Status: Valid UAE Work Visa
- Availability: Immediate start

I would be honored to contribute to Emirates Group's cutting-edge IT initiatives.

Best regards,
Muhammed Fasil PV
+971 555923545
faztrick@gmail.com
https://linkedin.com/in/faztrick
https://www.uaecodes.com
"@

# ============================================
# JOB APPLICATION 3: 360tf (VERIFIED LEGITIMATE)
# ============================================
Write-Host ""
Write-Host "[3/3] 360tf Senior Software Engineer Application" -ForegroundColor Yellow
Write-Host "  Company: 360tf (Glassdoor: 4.6/5 stars, 95% recommend)" -ForegroundColor White
Write-Host "  Industry: Trade Finance Fintech, DMCC Dubai" -ForegroundColor White

$tf360Subject = "Application for Senior Software Engineer | 10+ Years Java/Python/AI Experience | Dubai"
$tf360Body = @"
Dear 360tf Hiring Team,

I am writing to apply for the Senior Software Engineer position at 360tf in Dubai.

I was impressed to learn that 360tf is a leading digital trade finance platform with excellent employee reviews (4.6/5 on Glassdoor). With 10+ years of software engineering experience, I am excited to contribute to your innovative fintech solutions.

MY QUALIFICATIONS MATCHING YOUR REQUIREMENTS:

Java & Spring Boot:
- Enterprise microservices architecture
- Scalable backend systems for 50+ branch operations

Python:
- Advanced Python for AI/ML and backend development
- Data processing and automation pipelines

Agentic AI (Key Expertise):
- LangChain, LangGraph for autonomous AI agents
- OpenAI API integration
- Built AI Self-Checkout Kiosk (Gitex Dubai 2024)

AWS Services:
- EC2, S3, Lambda, and full cloud architecture
- Also proficient in Azure and GCP

DevOps:
- Docker, Kubernetes containerization
- CI/CD with GitHub Actions, Azure DevOps

AVAILABILITY:
- Currently in Dubai with valid UAE Work Visa
- Available for immediate start

I am passionate about developing robust fintech applications and working on emerging AI technologies.

Best regards,
Muhammed Fasil PV
+971 555923545
faztrick@gmail.com
https://linkedin.com/in/faztrick
https://www.uaecodes.com
"@

# ============================================
# MAIN MENU
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SELECT AN OPTION:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Send TCS Flutter Developer Application" -ForegroundColor White
Write-Host "  2. Send Emirates AI Engineer Application" -ForegroundColor White
Write-Host "  3. Send 360tf Application" -ForegroundColor White
Write-Host "  4. Send ALL Applications (opens 3 tabs)" -ForegroundColor Green
Write-Host "  5. Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Opening TCS application..." -ForegroundColor Yellow
        # For TCS, we'll send to careers or use LinkedIn InMail
        # Since we have the recruiter's LinkedIn, suggest InMail approach
        Start-Process "https://www.linkedin.com/jobs/view/flutter-developer-at-tata-consultancy-services-4323240582"
        Write-Host "  LinkedIn job page opened. Click 'Apply' button." -ForegroundColor Green
        Write-Host "  Recruiter LinkedIn: https://in.linkedin.com/in/deepali-upadhyay-83aa11172" -ForegroundColor Cyan
    }
    "2" {
        Write-Host ""
        Write-Host "Opening Emirates application..." -ForegroundColor Yellow
        Start-Process "https://www.emiratesgroupcareers.com/search-and-apply/"
        Write-Host "  Emirates Careers portal opened." -ForegroundColor Green
        Write-Host "  Search for: Senior Software Engineer AI" -ForegroundColor Cyan
    }
    "3" {
        Write-Host ""
        Write-Host "Opening 360tf application..." -ForegroundColor Yellow
        Start-Process "https://ae.linkedin.com/jobs/view/senior-software-engineer-flutter-and-angular-at-360tf-4326280897"
        Write-Host "  LinkedIn job page opened. Click 'Apply' button." -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "Opening ALL application pages..." -ForegroundColor Yellow
        Start-Process "https://www.linkedin.com/jobs/view/flutter-developer-at-tata-consultancy-services-4323240582"
        Start-Sleep -Seconds 1
        Start-Process "https://www.emiratesgroupcareers.com/search-and-apply/"
        Start-Sleep -Seconds 1
        Start-Process "https://ae.linkedin.com/jobs/view/senior-software-engineer-flutter-and-angular-at-360tf-4326280897"
        Write-Host "  All 3 application pages opened!" -ForegroundColor Green
    }
    "5" {
        Write-Host "Exiting..." -ForegroundColor Red
        exit
    }
    default {
        Write-Host "Invalid choice. Opening all applications..." -ForegroundColor Yellow
        Start-Process "https://www.linkedin.com/jobs/view/flutter-developer-at-tata-consultancy-services-4323240582"
        Start-Process "https://www.emiratesgroupcareers.com/search-and-apply/"
        Start-Process "https://ae.linkedin.com/jobs/view/senior-software-engineer-flutter-and-angular-at-360tf-4326280897"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FOLLOW-UP REMINDER" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Set a reminder to follow up in 5-7 days" -ForegroundColor White
Write-Host "  Track applications in: JOB-APPLICATIONS-DEC-2025.md" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
