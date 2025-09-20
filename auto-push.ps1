# Auto Git Push Script for Benedicto Exam Portal
# This script automatically commits and pushes changes to GitHub

param(
    [string]$CommitMessage = "Auto commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [int]$CheckInterval = 300  # Check every 5 minutes (300 seconds)
)

# Function to check for changes
function Check-For-Changes {
    $status = git status --porcelain
    return $status.Length -gt 0
}

# Function to commit and push changes
function Push-Changes {
    try {
        Write-Host "Checking for changes..." -ForegroundColor Yellow
        
        # Check if there are any changes
        if (Check-For-Changes) {
            Write-Host "Changes detected. Adding files..." -ForegroundColor Green
            
            # Add all changes
            git add .
            
            # Commit changes
            git commit -m "$CommitMessage"
            
            # Push to remote repository
            Write-Host "Pushing changes to GitHub..." -ForegroundColor Green
            git push origin main
            
            Write-Host "Changes successfully pushed to GitHub!" -ForegroundColor Cyan
        } else {
            Write-Host "No changes detected." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error occurred: $_" -ForegroundColor Red
    }
}

# Main loop
Write-Host "Auto Git Push Script Started" -ForegroundColor Cyan
Write-Host "Monitoring directory for changes every $CheckInterval seconds..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the script" -ForegroundColor Gray

while ($true) {
    Push-Changes
    Start-Sleep -Seconds $CheckInterval
}