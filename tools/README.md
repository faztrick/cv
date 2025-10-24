# Tools

Scripts in this folder automate setup tasks for the job-application bots that live under `automation\repos`.

## setup-job-bot.ps1

Clones and prepares one of the supported bots (LinkedIn Python, LinkedIn Node, Indeed Python). The script:

- Ensures the target repository exists under `automation\repos`.
- Clones the upstream project if missing (or when `-ForceReclone` is passed).
- Detects the project type and installs dependencies (Python `requirements.txt` or Node `package.json`).
- Prints the next-step commands so you can run the bot immediately.

Usage (PowerShell):

```powershell
# Prepare the default LinkedIn Python bot
pwsh -File "e:\cv\tools\setup-job-bot.ps1"

# Prepare the Indeed Python bot and force a fresh clone
pwsh -File "e:\cv\tools\setup-job-bot.ps1" -RepoChoice IndeedPython -ForceReclone
```

Parameters:

- `-RepoChoice`: One of `LinkedInPython`, `LinkedInNode`, or `IndeedPython` (default: `LinkedInPython`).
- `-BaseDir`: Relative path for the repos (default: `automation\repos`).
- `-ForceReclone`: Re-clone the repository even if a copy already exists.
