/**
 * Mobile Inventory Management - Google Apps Script Backend
 *
 * This script handles:
 * - Book lookups by book_code
 * - Transaction submissions (add to Transactions sheet, update Books total)
 *
 * Deploy as Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

// Sheet names - modify if your sheets have different names
const BOOKS_SHEET_NAME = 'Books';
const TRANSACTIONS_SHEET_NAME = 'Transactions';

/**
 * Handle GET requests - Book lookup
 * URL parameter: code (book_code to lookup)
 * Returns: JSON with book details or error
 */
function doGet(e) {
  try {
    const bookCode = e.parameter.code;

    if (!bookCode) {
      return createResponse({ error: 'Missing book_code parameter' }, 400);
    }

    const book = lookupBook(bookCode);

    if (!book) {
      return createResponse({ error: 'Book not found' }, 404);
    }

    return createResponse(book, 200);

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createResponse({ error: 'Server error: ' + error.toString() }, 500);
  }
}

/**
 * Handle POST requests - Add transaction
 * Body: JSON with { book_code, qty, location, user, comments }
 * Returns: JSON with updated book total or error
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validate required fields
    if (!data.book_code || data.qty === undefined || !data.location || !data.user) {
      return createResponse({
        error: 'Missing required fields: book_code, qty, location, user'
      }, 400);
    }

    // Validate qty is a number
    const qty = parseFloat(data.qty);
    if (isNaN(qty)) {
      return createResponse({ error: 'qty must be a valid number' }, 400);
    }

    // Check if book exists
    const book = lookupBook(data.book_code);
    if (!book) {
      return createResponse({ error: 'Book not found' }, 404);
    }

    // Add transaction and update book total
    const result = addTransaction({
      book_code: data.book_code,
      qty: qty,
      location: data.location,
      user: data.user,
      comments: data.comments || ''
    });

    return createResponse(result, 200);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse({ error: 'Server error: ' + error.toString() }, 500);
  }
}

/**
 * Handle OPTIONS requests - CORS preflight
 * This is required for cross-origin requests from browsers
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Look up a book by book_code
 * @param {string} bookCode - The book code to search for
 * @returns {object|null} Book object or null if not found
 */
function lookupBook(bookCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const booksSheet = ss.getSheetByName(BOOKS_SHEET_NAME);

  if (!booksSheet) {
    throw new Error('Books sheet not found. Check BOOKS_SHEET_NAME constant.');
  }

  const data = booksSheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const codeCol = headers.indexOf('book_code');
  const seriesCol = headers.indexOf('book_series');
  const nameCol = headers.indexOf('book_name');
  const totalCol = headers.indexOf('total');
  const updateCol = headers.indexOf('last_update');

  if (codeCol === -1) {
    throw new Error('book_code column not found in Books sheet');
  }

  // Normalize book code (remove hyphens, spaces, make uppercase for comparison)
  const normalizedSearchCode = bookCode.toString().replace(/[-\s]/g, '').toUpperCase();

  // Search for book (skip header row)
  for (let i = 1; i < data.length; i++) {
    const sheetCode = data[i][codeCol].toString().replace(/[-\s]/g, '').toUpperCase();

    if (sheetCode === normalizedSearchCode) {
      return {
        book_code: data[i][codeCol],
        book_series: seriesCol !== -1 ? data[i][seriesCol] : '',
        book_name: nameCol !== -1 ? data[i][nameCol] : '',
        total: totalCol !== -1 ? data[i][totalCol] : 0,
        last_update: updateCol !== -1 ? data[i][updateCol] : '',
        rowIndex: i + 1 // Store for updating later (1-based)
      };
    }
  }

  return null;
}

/**
 * Add a transaction and update book total
 * @param {object} transaction - Transaction data
 * @returns {object} Result with new total
 */
function addTransaction(transaction) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
  const booksSheet = ss.getSheetByName(BOOKS_SHEET_NAME);

  if (!transSheet) {
    throw new Error('Transactions sheet not found. Check TRANSACTIONS_SHEET_NAME constant.');
  }

  if (!booksSheet) {
    throw new Error('Books sheet not found. Check BOOKS_SHEET_NAME constant.');
  }

  // Get current book details
  const book = lookupBook(transaction.book_code);
  if (!book) {
    throw new Error('Book not found');
  }

  // Add transaction row to Transactions sheet
  const timestamp = new Date();
  transSheet.appendRow([
    transaction.book_code,
    transaction.qty,
    transaction.location,
    timestamp,
    transaction.user,
    transaction.comments
  ]);

  // Update Books sheet
  const newTotal = (book.total || 0) + transaction.qty;

  const booksData = booksSheet.getDataRange().getValues();
  const headers = booksData[0];
  const totalCol = headers.indexOf('total');
  const updateCol = headers.indexOf('last_update');

  if (totalCol !== -1) {
    booksSheet.getRange(book.rowIndex, totalCol + 1).setValue(newTotal);
  }

  if (updateCol !== -1) {
    booksSheet.getRange(book.rowIndex, updateCol + 1).setValue(timestamp);
  }

  return {
    success: true,
    book_code: transaction.book_code,
    book_name: book.book_name,
    old_total: book.total || 0,
    new_total: newTotal,
    transaction_qty: transaction.qty,
    timestamp: timestamp
  };
}

/**
 * Create a JSON response with CORS headers
 * @param {object} data - Data to return
 * @param {number} status - HTTP status code
 * @returns {ContentService.TextOutput}
 */
function createResponse(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Create a CORS response for OPTIONS requests
 * @returns {ContentService.TextOutput}
 */
function createCorsResponse() {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

/**
 * Test function - Lookup a book
 * Run this from Script Editor to test
 */
function testLookup() {
  const book = lookupBook('TEST001');
  Logger.log(book);
}

/**
 * Test function - Add a transaction
 * Run this from Script Editor to test
 */
function testTransaction() {
  const result = addTransaction({
    book_code: 'TEST001',
    qty: 5,
    location: 'Warehouse A',
    user: 'Test User',
    comments: 'Test transaction'
  });
  Logger.log(result);
}
