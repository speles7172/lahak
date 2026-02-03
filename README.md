# 📦 Mobile Inventory Manager

A simple, mobile-optimized web application for inventory management with barcode scanning and Google Sheets integration.

## Features

- 📷 **Barcode Scanning**: Use mobile camera to scan UPC, EAN, and Code128 barcodes
- 📱 **Mobile-First Design**: Optimized for smartphone use
- 📊 **Google Sheets Integration**: Direct integration with your existing Google Sheets
- ✅ **Simple Interface**: Clean, intuitive UI for quick transactions
- 💾 **Auto-Save**: Remembers user name across sessions
- 🚀 **PWA Support**: Install to home screen for app-like experience

## Project Structure

```
inventory-app/
├── index.html              # Main application
├── manifest.json           # PWA manifest
├── css/
│   └── styles.css         # Mobile-first styles
├── js/
│   ├── app.js            # Main application logic
│   ├── scanner.js        # Barcode scanning
│   └── sheets-api.js     # Google Sheets API
├── lib/
│   └── html5-qrcode.min.js  # Barcode library
├── icons/                 # PWA icons (192x192, 512x512)
├── google-apps-script/
│   └── Code.gs           # Backend script
└── README.md
```

## Setup Instructions

### Step 1: Prepare Your Google Sheet

1. Open your existing Google Sheet or create a new one
2. Ensure you have two sheets with these exact column headers:

**Books Sheet:**
| book_code | book_series | book_name | total | last_update |
|-----------|-------------|-----------|-------|-------------|

**Transactions Sheet:**
| book_code | qty | location | datetime | user | comments |
|-----------|-----|----------|----------|------|----------|

3. Add some sample book data to test with

### Step 2: Deploy Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `google-apps-script/Code.gs`
4. Paste it into the Apps Script editor
5. **IMPORTANT**: Update the sheet names at the top of the script if yours are different:
   ```javascript
   const BOOKS_SHEET_NAME = 'Books';  // Change if needed
   const TRANSACTIONS_SHEET_NAME = 'Transactions';  // Change if needed
   ```
6. Click **Deploy** → **New deployment**
7. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
8. Configure the deployment:
   - **Description**: Inventory Manager API
   - **Execute as**: Me
   - **Who has access**: Anyone
9. Click **Deploy**
10. **Copy the Web App URL** - you'll need this in the next step
11. Click **Authorize access** and grant the necessary permissions

### Step 3: Configure the Frontend

1. Open `js/sheets-api.js` in a text editor
2. Find this line near the top:
   ```javascript
   this.SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with the Web App URL you copied in Step 2
4. Save the file

### Step 4: Test Locally

1. Open a terminal in the project directory
2. Start a local web server:

   **Option A: Python (if installed)**
   ```bash
   python -m http.server 8000
   ```

   **Option B: Node.js (if installed)**
   ```bash
   npx serve .
   ```

   **Option C: PHP (if installed)**
   ```bash
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`
4. Test the app:
   - Try manual entry with a book code from your sheet
   - If the book is found, the details should display
   - Fill in the transaction form and submit
   - Check your Google Sheet to verify the transaction was recorded

### Step 5: Deploy to the Web

**Option A: GitHub Pages (Recommended)**

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to repository **Settings** → **Pages**
4. Set source to `main` branch
5. Your app will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

**Option B: Netlify**

1. Sign up at [netlify.com](https://www.netlify.com/)
2. Drag and drop your project folder to deploy
3. Your app will be live at a netlify URL

**Option C: Vercel**

1. Sign up at [vercel.com](https://vercel.com/)
2. Import your GitHub repository or upload files
3. Deploy with one click

### Step 6: Add PWA Icons (Optional)

1. Create or download two PNG icons:
   - `icons/icon-192.png` (192x192 pixels)
   - `icons/icon-512.png` (512x512 pixels)
2. See `icons/ICON_INSTRUCTIONS.txt` for detailed guidance

### Step 7: Mobile Testing

1. Open the deployed URL on your mobile phone
2. Test barcode scanning:
   - Tap "Scan Barcode"
   - Allow camera permissions
   - Point camera at a barcode matching your book codes
3. Install to home screen:
   - **iOS Safari**: Tap Share → Add to Home Screen
   - **Android Chrome**: Tap Menu → Add to Home Screen

## Usage Guide

### Scanning a Barcode

1. Tap **"📷 Scan Barcode"** button
2. Allow camera access when prompted
3. Point camera at barcode
4. App will automatically detect and lookup the book

### Manual Entry

1. Type the book code in the input field
2. Tap **"Lookup"** or press Enter
3. Book details will display if found

### Recording a Transaction

1. After looking up a book:
2. Enter **Quantity**:
   - Positive numbers for items IN (e.g., 10)
   - Negative numbers for items OUT (e.g., -5)
3. Enter **Location** (e.g., "Warehouse A", "Shelf B2")
4. Enter **Your Name** (saved automatically for next time)
5. Optionally add **Comments**
6. Tap **"✓ Submit Transaction"**
7. Transaction is recorded and book total is updated

### Tips for Best Experience

- Use in portrait mode on mobile
- Ensure good lighting for barcode scanning
- Keep barcodes flat and in focus
- Use manual entry as fallback if camera doesn't work
- Your name is saved locally, no need to re-enter each time

## Troubleshooting

### "Google Apps Script URL not configured"

- Make sure you updated `js/sheets-api.js` with your deployed Web App URL
- Refresh the page after updating the file

### "Book not found"

- Verify the book code exists in your Books sheet
- Check that the `book_code` column name is correct
- Ensure there are no extra spaces in the book codes

### Camera not working

- Ensure you're using HTTPS (required for camera access)
- Check that you granted camera permissions
- Try a different browser (Chrome/Safari recommended)
- Use manual entry as fallback

### Transaction not saving

- Check the browser console for errors (F12)
- Verify the Apps Script deployment is set to "Anyone" access
- Ensure all required fields are filled (book_code, qty, location, user)
- Check your Google Sheet for proper column headers

### Barcode not scanning

- Ensure good lighting
- Hold camera steady and at proper distance
- Try different angles
- Some barcode formats may not be supported
- Use manual entry for unsupported codes

## Browser Compatibility

**Mobile:**
- ✅ Chrome (Android) - Recommended
- ✅ Safari (iOS) - Recommended
- ✅ Firefox (Android)
- ⚠️ Samsung Internet - Limited testing

**Desktop:**
- ✅ Chrome
- ✅ Edge
- ✅ Firefox
- ✅ Safari

**Camera Requirements:**
- HTTPS connection required
- Back camera preferred for barcode scanning
- Camera permissions must be granted

## Security Notes

- The Google Apps Script is deployed with "Anyone" access for simplicity
- Input validation is performed on both frontend and backend
- No sensitive user data is stored
- Camera access is only requested when needed
- All data is stored in your Google Sheet under your control

## Future Enhancements

Potential features for future versions:

- [ ] Offline support with service worker
- [ ] Transaction history view
- [ ] Search books by name
- [ ] Export transaction reports
- [ ] Multi-user authentication
- [ ] Low stock alerts
- [ ] Dark mode
- [ ] Multiple location management

## Technical Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework)
- **Barcode Library**: html5-qrcode v2.3.8
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Hosting**: GitHub Pages / Netlify / Vercel

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review the browser console for error messages
3. Verify your Google Sheet structure matches requirements
4. Ensure Apps Script deployment is configured correctly

## License

This project is open source and available for personal and commercial use.

## Credits

Built with:
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) by Minhaz
- Google Apps Script
- Modern web standards

---

**Version**: 1.0
**Last Updated**: 2026-01-30
#   l a h a k  
 