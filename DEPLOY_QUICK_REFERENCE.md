# Deployment Quick Reference

## Prerequisites Check

- [ ] WinSCP installed at `C:\Program Files (x86)\WinSCP\WinSCP.com`
- [ ] SSH key exists at `%USERPROFILE%\.ssh\matematica-ch.ppk`
- [ ] PowerShell execution policy allows scripts

## Deployment Commands

```powershell
# Build
npm run build

# Deploy
.\deploy.ps1
```

## Deployment URL

**https://matematica.ch/tools/powers-explorer/**

## Configuration Summary

| Setting | Value |
|---------|-------|
| **Server** | s051.cyon.net |
| **Username** | matemati |
| **Protocol** | SFTP (port 22) |
| **Remote Path** | `/public_html/matematica.ch/tools/powers-explorer/` |
| **SSH Key** | `%USERPROFILE%\.ssh\matematica-ch.ppk` |
| **Base Path** | `/tools/powers-explorer/` (in vite.config.js) |

## Troubleshooting Quick Fixes

### WinSCP not found
```powershell
# Download from: https://winscp.net
# Or update $WINSCP_PATH in deploy.ps1
```

### PowerShell script disabled
```powershell
# Run as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Deployment failed - check logs
```powershell
# View log file:
notepad $env:TEMP\winscp_deploy.log
```

### Remote directory doesn't exist
1. Open WinSCP GUI
2. Connect to server manually
3. Create `/public_html/matematica.ch/tools/powers-explorer/` folder
4. Run deploy script again

## Files Modified by This Implementation

| File | Status | Purpose |
|------|--------|---------|
| `deploy.ps1` | ✅ Updated | WinSCP deployment script |
| `vite.config.js` | ✅ Already correct | Base path `/tools/powers-explorer/` |
| `DEPLOYMENT.md` | ✅ Created | Comprehensive deployment guide |
| `DEPLOY_QUICK_REFERENCE.md` | ✅ Created | This quick reference |

## Verification Checklist

After deployment:

- [ ] Site loads at https://matematica.ch/tools/powers-explorer/
- [ ] Menu displays correctly
- [ ] Cosmic Comparison mode works
- [ ] Solar System mode works
- [ ] No console errors (F12 → Console)
- [ ] All data files load (F12 → Network)

## Alternative: Manual Deployment (WinSCP GUI)

1. Open WinSCP
2. Connect to `matemati@s051.cyon.net` (SFTP, port 22)
3. Use private key: `.ssh\matematica-ch.ppk`
4. Navigate to `/public_html/matematica.ch/tools/powers-explorer/`
5. Upload all from `dist\*`
6. Choose "Delete and upload" option

## Need Help?

See **DEPLOYMENT.md** for full documentation and detailed troubleshooting.

---

**Quick Tip:** Always run `npm run build` before deploying to ensure latest changes are included!
