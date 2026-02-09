# Deployment Guide - Powers Explorer

This guide explains how to deploy Powers Explorer to matematica.ch using the automated WinSCP deployment script.

## Quick Start

```powershell
# 1. Build the project
npm run build

# 2. Deploy to server
.\deploy.ps1
```

## Prerequisites

### 1. WinSCP Installation
- **Download:** https://winscp.net
- **Default installation path:** `C:\Program Files (x86)\WinSCP\`
- **Required component:** WinSCP.com (command-line interface)

### 2. SSH Key Setup
- **Key format:** PuTTY .ppk file
- **Expected location:** `%USERPROFILE%\.ssh\matematica-ch.ppk`
- **Passphrase:** May be required during deployment

### 3. PowerShell Execution Policy
If you get an execution policy error when running the script:

```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Deployment Configuration

The deployment script (`deploy.ps1`) is pre-configured with the following settings:

```powershell
$REMOTE_HOST = "s051.cyon.net"                                    # Server hostname
$REMOTE_USER = "matemati"                                         # SFTP username
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\matematica-ch.ppk"        # SSH key path
$REMOTE_PATH = "/public_html/matematica.ch/tools/powers-explorer/" # Target directory
$LOCAL_DIST = ".\dist"                                            # Local build folder
$WINSCP_PATH = "${env:ProgramFiles(x86)}\WinSCP\WinSCP.com"      # WinSCP CLI path
```

**Important:** The remote directory must already exist on the server. If it doesn't, create it manually using WinSCP GUI first.

## Deployment Process

### Step 1: Build for Production

```powershell
npm run build
```

**What this does:**
- Creates optimized production build in `dist/` folder
- Bundles and minifies JavaScript
- Generates cache-busting hashes for assets
- Copies all data files from `public/assets/data/` to `dist/assets/data/`
- Configures base path as `/tools/powers-explorer/` (set in vite.config.js)

**Expected output:**
```
dist/
├── index.html
└── assets/
    ├── index-[hash].js
    ├── index-[hash].js.map
    └── data/
        ├── cosmic-objects.json
        ├── orbital-parameters.json
        └── physical-constants.json
```

### Step 2: Run Deployment Script

```powershell
.\deploy.ps1
```

**What this does:**
1. Verifies WinSCP is installed
2. Verifies SSH key exists
3. Verifies `dist/` folder exists
4. Shows deployment configuration summary
5. Asks for confirmation (`yes`/`no`)
6. Creates temporary WinSCP script with upload commands
7. Connects to server via SFTP using .ppk key
8. Uploads all files from `dist/` to remote server
9. Deletes old files before uploading new ones (clean deployment)
10. Creates log file at `%TEMP%\winscp_deploy.log`
11. Reports success or failure

**Authentication:**
- Uses SSH key authentication (no password needed)
- If your .ppk key has a passphrase, you'll be prompted to enter it
- First connection accepts server host key automatically

### Step 3: Verify Deployment

Visit: **https://matematica.ch/tools/powers-explorer/**

**Verification Checklist:**
- [ ] Index page loads
- [ ] Menu shows all mode buttons
- [ ] Cosmic Comparison mode works
- [ ] Solar System mode loads
- [ ] All three Solar System views work (Size, Distance, Orbital)
- [ ] Planet info panel opens on click
- [ ] No console errors (press F12 → Console)
- [ ] All data files load (check Network tab in F12)
- [ ] Back button returns to menu

## Troubleshooting

### WinSCP Not Found

**Error:** `WinSCP not found at C:\Program Files (x86)\WinSCP\WinSCP.com`

**Solution:**
1. Download and install WinSCP from https://winscp.net
2. Install to default location
3. If installed elsewhere, update `$WINSCP_PATH` variable in deploy.ps1

### SSH Key Not Found

**Error:** `SSH key not found at C:\Users\[user]\.ssh\matematica-ch.ppk`

**Solution:**
- Verify the .ppk file exists at the specified location
- Update `$SSH_KEY_PATH` in deploy.ps1 if it's stored elsewhere
- Ensure the key is in PuTTY .ppk format (not OpenSSH format)

### Connection Failed

**Error:** SFTP connection fails

**Solution:**
1. Check log file: `%TEMP%\winscp_deploy.log`
2. Verify hostname: `s051.cyon.net`
3. Verify username: `matemati`
4. Test manual connection in WinSCP GUI first
5. Ensure SFTP is enabled on hosting account
6. Check firewall allows SFTP connections (port 22)

### Remote Directory Not Found

**Error:** Cannot change directory to `/public_html/matematica.ch/tools/powers-explorer/`

**Solution:**
1. Open WinSCP GUI
2. Connect to server
3. Manually create the directory structure:
   - Navigate to `/public_html/matematica.ch/tools/`
   - Create `powers-explorer/` folder
4. Run deployment script again

### Authentication Failed

**Error:** Authentication fails with .ppk key

**Solution:**
- Verify .ppk key path is correct
- Ensure key is in PuTTY format (not OpenSSH)
- To convert OpenSSH key to .ppk:
  1. Open PuTTYgen (installed with WinSCP)
  2. Load your OpenSSH private key
  3. Save as .ppk format
- Check key passphrase is correct

### PowerShell Execution Policy Error

**Error:** `File cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Blank Page After Deployment

**Possible causes:**
1. **Base path mismatch** - Verify `vite.config.js` has `base: '/tools/powers-explorer/'`
2. **Assets not found (404)** - Check browser console, verify all files uploaded
3. **Browser compatibility** - Requires modern browser with ES6 support

### Data Files Not Loading

**Error:** 404 errors for JSON files in console

**Solution:**
- Verify `assets/data/` folder exists on server
- Check all three JSON files are present:
  - `cosmic-objects.json`
  - `orbital-parameters.json`
  - `physical-constants.json`
- Ensure file names match exactly (case-sensitive on Linux servers)

## Alternative Deployment Methods

If the automated script fails, you can deploy manually:

### Method 1: WinSCP GUI

1. Open WinSCP application
2. Create new connection:
   - Protocol: SFTP
   - Host: `s051.cyon.net`
   - Port: 22
   - Username: `matemati`
   - Private key: Browse to your .ppk file
3. Click "Login"
4. Navigate to `/public_html/matematica.ch/tools/powers-explorer/`
5. Upload all contents from local `dist/` folder
6. Choose "Delete and upload" to replace old files

### Method 2: Other SFTP Clients

Use FileZilla, Cyberduck, or similar:
1. Connect via SFTP to `s051.cyon.net` (port 22)
2. Use username `matemati` with SSH key authentication
3. Navigate to `public_html/matematica.ch/tools/powers-explorer/`
4. Upload all files from `dist/` folder

**Note:** WinSCP is recommended because it handles .ppk keys natively.

## Future Deployments

After making changes to the project:

```powershell
# 1. Make code changes locally
# 2. Test with development server (npm run dev)
# 3. Build
npm run build

# 4. Deploy (overwrites previous deployment)
.\deploy.ps1

# 5. Clear browser cache to see changes
```

**Note:** The deployment script and configuration only need to be set up once. Future deployments are fully automated.

## How WinSCP Deployment Works

The script creates a temporary WinSCP script file with these commands:

```
option batch abort           # Stop on any error
option confirm off           # Don't prompt for confirmations
open sftp://matemati@s051.cyon.net/ -privatekey="..." -hostkey=*
option transfer binary       # Use binary transfer mode
cd /public_html/matematica.ch/tools/powers-explorer/
lcd "C:\...\dist"           # Change to local dist folder
put -delete *                # Upload all, delete old files first
exit
```

**Key features:**
- Connects via SFTP (secure file transfer)
- Uses SSH key authentication (.ppk format)
- Binary transfer mode (no line ending conversion)
- `-delete` flag ensures clean deployment (removes old files)
- `-hostkey=*` accepts any host key (convenient but less secure)

## Log Files

**Location:** `%TEMP%\winscp_deploy.log` (typically `C:\Users\[user]\AppData\Local\Temp\`)

**Purpose:** Detailed WinSCP session log for debugging connection and transfer issues

**When to check:** If deployment fails, examine this log for detailed error messages

## Security Notes

- SSH key authentication is more secure than password authentication
- The .ppk key file should be kept secure and not shared
- Host key verification is disabled (`-hostkey=*`) for convenience
  - For production deployments, consider using specific host key fingerprint
- Deployment script does not store passwords or credentials
- WinSCP log files may contain sensitive paths; delete if concerned

## Support

For issues with:
- **WinSCP:** https://winscp.net/eng/docs/
- **Cyon hosting:** Contact Cyon support
- **Powers Explorer project:** Check project documentation in CLAUDE.md and README.md

---

**Last Updated:** 2024-12-27
**WinSCP Version:** 6.x+
**Target Server:** s051.cyon.net (Cyon hosting)
**Deployment URL:** https://matematica.ch/tools/powers-explorer/
