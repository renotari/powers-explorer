# Powers Explorer - Build and Deploy Script
# Builds the application then deploys to matematica.ch/tools/powers-explorer/

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
Write-Host "Powers Explorer - Build and Deploy Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:"
Write-Host "  Host: $REMOTE_USER@$REMOTE_HOST"
Write-Host "  Remote path: $REMOTE_PATH"
Write-Host "  Local build: $LOCAL_DIST"
Write-Host "  SSH Key: $SSH_KEY_PATH"
Write-Host "  WinSCP: $WINSCP_PATH"
Write-Host ""

# ============================================================
# STEP 1: BUILD APPLICATION
# ============================================================
Write-Host "================================================" -ForegroundColor Green
Write-Host "Step 1: Building Application" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Build Failed!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Deployment cancelled. Please fix build errors and try again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 2: VERIFY DEPLOYMENT REQUIREMENTS
# ============================================================
Write-Host "================================================" -ForegroundColor Green
Write-Host "Step 2: Verifying Deployment Requirements" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
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
    Write-Host "This shouldn't happen after a successful build!" -ForegroundColor Red
    exit 1
}

Write-Host "All requirements verified!" -ForegroundColor Green
Write-Host ""

# Get absolute path for dist folder (WinSCP needs it)
$absoluteDistPath = (Resolve-Path $LOCAL_DIST).Path

# ============================================================
# STEP 3: DEPLOY TO SERVER
# ============================================================
Write-Host "================================================" -ForegroundColor Green
Write-Host "Step 3: Deploy to Server" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

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
    Write-Host "Build and Deployment Successful!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "Your site should be available at:"
    Write-Host "https://matematica.ch/tools/powers-explorer/" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Deployment Failed!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Check the log file for details: $env:TEMP\winscp_deploy.log" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
