# Watch and Push Script for Benedicto Exam Portal
# This script watches for file changes and automatically pushes to GitHub

param(
    [string]$WatchPath = ".",
    [string]$CommitMessage = "Auto commit: File changes detected at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

# Function to commit and push changes
function Push-Changes {
    try {
        Write-Host "Changes detected. Checking git status..." -ForegroundColor Yellow
        
        # Check if there are any changes
        $status = git status --porcelain
        if ($status.Length -gt 0) {
            Write-Host "Adding files..." -ForegroundColor Green
            git add .
            
            Write-Host "Committing changes..." -ForegroundColor Green
            git commit -m "$CommitMessage"
            
            Write-Host "Pushing to GitHub..." -ForegroundColor Green
            git push origin main
            
            Write-Host "Changes successfully pushed to GitHub!" -ForegroundColor Cyan
            Write-Host "========================================" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error occurred: $_" -ForegroundColor Red
    }
}

# Create a FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Resolve-Path $WatchPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Define the events to watch for
$events = "Changed", "Created", "Deleted"

# Register event handlers
foreach ($event in $events) {
    Register-ObjectEvent -InputObject $watcher -EventName $event -Action {
        $path = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType
        
        # Ignore temporary files and git directory changes
        if ($path -notlike "*.tmp" -and $path -notlike "*.temp" -and $path -notlike "*.log" -and $path -notlike "*\.git\*") {
            Write-Host "File $changeType: $path" -ForegroundColor Yellow
            
            # Debounce - wait a bit to see if more changes come in
            Start-Sleep -Milliseconds 2000
            
            # Push changes
            Push-Changes
        }
    } | Out-Null
}

Write-Host "File watcher started for: $((Resolve-Path $WatchPath).Path)" -ForegroundColor Cyan
Write-Host "Watching for changes... (Press Ctrl+C to stop)" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Gray

# Keep the script running
try {
    do {
        Start-Sleep -Seconds 1
    } while ($true)
} finally {
    # Clean up
    $watcher.Dispose()
    Get-EventSubscriber | Unregister-Event
}