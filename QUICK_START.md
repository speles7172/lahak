# 🚀 Quick Start Guide

Your Mobile Inventory Manager is ready! Follow these steps to get started.

## 📁 Project Structure

```
inventory-app/
├── index.html                      # Main application
├── manifest.json                   # PWA configuration
├── README.md                       # Full documentation
├── SETUP_CHECKLIST.md             # Step-by-step setup guide
├── QUICK_START.md                 # This file
├── start-server.bat               # Windows server launcher
├── start-server.sh                # Mac/Linux server launcher
├── .gitignore                     # Git ignore rules
│
├── css/
│   └── styles.css                 # Mobile-first styles
│
├── js/
│   ├── app.js                     # Main application logic
│   ├── scanner.js                 # Barcode scanning
│   └── sheets-api.js              # Google Sheets API
│
├── lib/
│   ├── html5-qrcode.min.js        # ✅ Barcode library (downloaded)
│   └── DOWNLOAD_INSTRUCTIONS.txt
│
├── icons/
│   └── ICON_INSTRUCTIONS.txt      # ⚠️ Need to add icons
│
└── google-apps-script/
    └── Code.gs                    # Backend script
```

## ⚡ Quick Setup (5 minutes)

### Step 1: Google Sheet
- Open your Google Sheet with Books and Transactions sheets
- Verify column headers match requirements (see README)

### Step 2: Deploy Apps Script
1. Go to Extensions → Apps Script in your Google Sheet
2. Copy all code from `google-apps-script/Code.gs`
3. Paste into Apps Script editor
4. Deploy → New deployment → Web app
5. Set "Execute as" = Me, "Who has access" = Anyone
6. **Copy the Web App URL**

### Step 3: Configure Frontend
1. Open `js/sheets-api.js`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your URL
3. Save the file

### Step 4: Test It
**Windows:**
```bash
start-server.bat
```

**Mac/Linux:**
```bash
./start-server.sh
```

Open http://localhost:8000 and test with a book code!

## 📝 Configuration Required

Before the app works, you must:

1. ✅ Deploy Google Apps Script (Step 2 above)
2. ✅ Update URL in `js/sheets-api.js` (Step 3 above)
3. ⚠️ (Optional) Add icons to `icons/` folder

## 🧪 Quick Test

1. Start local server (see Step 4)
2. Open http://localhost:8000
3. Enter a book code from your sheet
4. Submit a test transaction
5. Check Google Sheet for the new row

## 🌐 Deploy to Production

Choose one:

**GitHub Pages:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
# Enable Pages in GitHub repository settings
```

**Netlify:**
- Drag and drop your folder to netlify.com

**Vercel:**
- Upload to vercel.com

## 📱 Mobile Usage

1. Open your deployed URL on mobile
2. Tap "Scan Barcode" to use camera
3. Or enter code manually
4. Fill transaction form and submit
5. Add to home screen for app-like experience:
   - iOS: Share → Add to Home Screen
   - Android: Menu → Add to Home Screen

## 🔧 Key Files to Configure

| File | What to Change |
|------|----------------|
| `js/sheets-api.js` | Line 12: Add your Apps Script URL |
| `google-apps-script/Code.gs` | Lines 13-14: Update sheet names if different |
| `icons/` | Add icon-192.png and icon-512.png (optional) |

## 📖 More Information

- **Full Setup Guide:** See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
- **Complete Documentation:** See [README.md](README.md)
- **Troubleshooting:** See README Troubleshooting section

## ✨ Features Overview

- **Barcode Scanning:** UPC, EAN, Code128 support
- **Mobile-First:** Optimized for smartphones
- **Google Sheets:** Direct integration, no database needed
- **Simple UI:** Quick transaction entry
- **PWA Support:** Install to home screen
- **Auto-Save:** Remembers user name

## 🎯 Next Steps

1. [ ] Complete Step 2 (Deploy Apps Script)
2. [ ] Complete Step 3 (Configure Frontend)
3. [ ] Test locally (Step 4)
4. [ ] Add sample books to your Google Sheet
5. [ ] Deploy to production
6. [ ] Test on mobile device
7. [ ] (Optional) Add PWA icons

---

**Need Help?** Check [README.md](README.md) for detailed documentation and troubleshooting.

**Ready to deploy?** See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for the complete checklist.
