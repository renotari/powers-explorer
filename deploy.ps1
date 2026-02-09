# Powers Explorer - Deployment Script (WinSCP Version)
# Deploys to matematica.ch/tools/powers-explorer/

# ============================================================
# CONFIGURATION
# ============================================================
$REMOTE_HOST = "s051.cyon.net"
$REMOTE_USER = "matemati"
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\matematica-ch.ppk"
$REMOTE_PATH = "/home/matemati/public_html/matematica.ch/tools/powers-explorer/"
$LOCAL_DIST = ".\dist"

# Search for WinSCP in common installation locations
$possiblePaths = @(
    "${env:ProgramFiles}\WinSCP\WinSCP.com",
    "${env:ProgramFiles(x86)}\WinSCP\WinSCP.com",
    "${env:LOCALAPPDATA}\Programs\WinSCP\WinSCP.com"
)

$WINSCP_PATH = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $WINSCP_PATH = $path
        break
    }
}
# ============================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Powers Explorer - Deployment Script (WinSCP)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment Configuration:"
Write-Host "  Host: $REMOTE_USER@$REMOTE_HOST"
Write-Host "  Remote path: $REMOTE_PATH"
Write-Host "  Local build: $LOCAL_DIST"
Write-Host "  SSH Key: $SSH_KEY_PATH"
Write-Host "  WinSCP: $WINSCP_PATH"
Write-Host ""

# Verify WinSCP is installed
if (-not $WINSCP_PATH) {
    Write-Host "Error: WinSCP not found in any of the following locations:" -ForegroundColor Red
    foreach ($path in $possiblePaths) {
        Write-Host "  - $path" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please install WinSCP from https://winscp.net" -ForegroundColor Red
    Write-Host "Or manually set WINSCP_PATH at the top of this script" -ForegroundColor Red
    exit 1
}

# Verify SSH key exists
if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "Error: SSH key not found at $SSH_KEY_PATH" -ForegroundColor Red
    Write-Host "Please update SSH_KEY_PATH in the script" -ForegroundColor Red
    exit 1
}

# Verify dist folder exists
if (-not (Test-Path $LOCAL_DIST)) {
    Write-Host "Error: Build directory not found: $LOCAL_DIST" -ForegroundColor Red
    Write-Host "Run 'npm run build' first to create the production build" -ForegroundColor Red
    exit 1
}

# Get absolute path for dist folder (WinSCP needs it)
$absoluteDistPath = (Resolve-Path $LOCAL_DIST).Path

# Confirm deployment
$confirmation = Read-Host "Proceed with deployment? (yes/no)"
Write-Host ""
if ($confirmation -notmatch '^[Yy](es)?$') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Create temporary WinSCP script file
$scriptPath = [System.IO.Path]::GetTempFileName()
$scriptContent = @"
option batch abort
option confirm off
open sftp://$REMOTE_USER@$REMOTE_HOST/ -privatekey="$SSH_KEY_PATH" -hostkey=*
option transfer binary
cd $REMOTE_PATH
lcd "$absoluteDistPath"
put -delete *
exit
"@

Set-Content -Path $scriptPath -Value $scriptContent -Encoding ASCII

Write-Host "Uploading files with WinSCP..." -ForegroundColor Green
Write-Host ""

# Execute WinSCP with the script
& $WINSCP_PATH /script="$scriptPath" /log="$env:TEMP\winscp_deploy.log"

# Capture exit code
$exitCode = $LASTEXITCODE

# Clean up temporary script
Remove-Item $scriptPath -ErrorAction SilentlyContinue

# Report results
if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Your site should be available at:"
    Write-Host "https://matematica.ch/tools/powers-explorer/" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Check the log file for details: $env:TEMP\winscp_deploy.log" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
