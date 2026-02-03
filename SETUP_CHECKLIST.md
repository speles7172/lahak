# Setup Checklist

Follow these steps to get your Inventory Manager up and running:

## ✅ Pre-Setup (Already Done)

- [x] Project files created
- [x] html5-qrcode library downloaded
- [x] Directory structure ready

## 📋 Configuration Checklist

### 1. Google Sheet Setup

- [ ] Open your existing Google Sheet
- [ ] Verify "Books" sheet has columns: `book_code`, `book_series`, `book_name`, `total`, `last_update`
- [ ] Verify "Transactions" sheet has columns: `book_code`, `qty`, `location`, `datetime`, `user`, `comments`
- [ ] Add at least one test book to the Books sheet

### 2. Google Apps Script Deployment

- [ ] Go to Extensions → Apps Script in your Google Sheet
- [ ] Copy contents of `google-apps-script/Code.gs`
- [ ] Paste into Apps Script editor
- [ ] Update sheet names in code if different from "Books" and "Transactions"
- [ ] Save the script (Ctrl+S / Cmd+S)
- [ ] Click Deploy → New deployment → Web app
- [ ] Set "Execute as" to **Me**
- [ ] Set "Who has access" to **Anyone**
- [ ] Click Deploy and authorize
- [ ] **COPY THE WEB APP URL** (you'll need this next!)

**Your Web App URL:** _______________________________________________

### 3. Frontend Configuration

- [ ] Open `js/sheets-api.js` in a text editor
- [ ] Find line: `this.SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';`
- [ ] Replace with your actual Web App URL from step 2
- [ ] Save the file

### 4. Local Testing

- [ ] Start local web server (see README for options)
- [ ] Open `http://localhost:8000` in browser
- [ ] Test manual lookup with a book code from your sheet
- [ ] Verify book details display correctly
- [ ] Submit a test transaction
- [ ] Check Google Sheet to confirm transaction was recorded
- [ ] Verify Books sheet total was updated

### 5. Mobile Testing (Local Network)

- [ ] Find your computer's local IP address
  - Windows: `ipconfig` (look for IPv4)
  - Mac/Linux: `ifconfig` or `ip addr`
- [ ] On mobile, connect to same WiFi network
- [ ] Open browser and go to `http://YOUR_IP:8000`
- [ ] Test barcode scanning (allow camera permissions)
- [ ] Test transaction submission

### 6. Deployment

Choose one option:

**Option A: GitHub Pages**
- [ ] Create GitHub repository
- [ ] Push code to repository
- [ ] Enable GitHub Pages in repository settings
- [ ] Note your URL: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

**Option B: Netlify**
- [ ] Sign up at netlify.com
- [ ] Drag and drop project folder
- [ ] Note your URL: `https://YOUR_SITE.netlify.app`

**Option C: Vercel**
- [ ] Sign up at vercel.com
- [ ] Import repository or upload files
- [ ] Note your URL: `https://YOUR_SITE.vercel.app`

**Your Deployed URL:** _______________________________________________

### 7. PWA Icons (Optional)

- [ ] Create or download 192x192px icon
- [ ] Create or download 512x512px icon
- [ ] Save as `icons/icon-192.png` and `icons/icon-512.png`
- [ ] Redeploy if already deployed

### 8. Production Testing

- [ ] Open deployed URL on mobile device
- [ ] Test barcode scanning with real barcodes
- [ ] Submit several transactions
- [ ] Verify all transactions appear in Google Sheet
- [ ] Check that totals update correctly
- [ ] Test "Add to Home Screen" functionality

## 🔧 Configuration Summary

Once configured, remember these key pieces:

| Item | Value |
|------|-------|
| Google Sheet URL | _____________________________ |
| Apps Script URL | _____________________________ |
| Deployed App URL | _____________________________ |

## 🎯 Quick Test Script

Use this to quickly verify everything works:

1. Open the app on your mobile device
2. Scan a barcode OR enter a code manually
3. Verify book name appears
4. Enter transaction:
   - Qty: `5`
   - Location: `Test Location`
   - User: `Your Name`
   - Comments: `Test transaction`
5. Submit
6. Check Google Sheet for new transaction row
7. Verify book total increased by 5

## 🐛 Troubleshooting

**App shows "URL not configured":**
- Double-check you updated `js/sheets-api.js` with the correct Apps Script URL
- Make sure to save the file
- Clear browser cache or hard refresh (Ctrl+Shift+R)

**"Book not found" error:**
- Verify book code exists in your Books sheet
- Check for typos or extra spaces
- Ensure column header is exactly `book_code`

**Camera doesn't work:**
- Must use HTTPS (localhost is ok for testing)
- Grant camera permissions when prompted
- Try using Chrome on Android or Safari on iOS

**Transaction doesn't save:**
- Check browser console for errors (F12)
- Verify Apps Script is deployed with "Anyone" access
- Ensure all required fields are filled

## 📝 Notes

- Remember to save your configuration URLs above
- Keep your Apps Script URL secure (though it's ok if shared, your Google account controls access)
- Test thoroughly before deploying to production use
- Consider backing up your Google Sheet regularly

---

**Setup Complete?** ✅

Once all checkboxes are ticked, your Inventory Manager is ready to use!
