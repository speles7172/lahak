/**
 * Mobile Inventory Management - Google Apps Script Backend
 *
 * This script handles:
 * - User authentication (checking Users sheet)
 * - Initial data loading (users, locations, books)
 * - Book lookups by Book_code
 * - Transaction submissions with location-based inventory updates
 *
 * Deploy as Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

// Sheet names
const BOOKS_SHEET_NAME = 'Books';
const TRANSACTIONS_SHEET_NAME = 'Transactions';
const USERS_SHEET_NAME = 'Users';
const LOCATIONS_SHEET_NAME = 'Locations';

/**
 * Handle GET requests
 * Actions:
 * - ?action=init&email=... - Load all initial data (user, locations, books)
 * - ?code=... - Book lookup (legacy support)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const email = e.parameter.email;
    const bookCode = e.parameter.code;

    // New init action - load all data at once
    if (action === 'init' && email) {
      return handleInit(email);
    }

    // Legacy book lookup
    if (bookCode) {
      const book = lookupBook(bookCode);
      if (!book) {
        return createResponse({ error: 'Book not found' }, 404);
      }
      return createResponse(book, 200);
    }

    return createResponse({ error: 'Missing required parameters' }, 400);

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createResponse({ error: 'Server error: ' + error.toString() }, 500);
  }
}

/**
 * Handle initialization - validate user and load all data
 * @param {string} email - User's email from Google Sign-In
 * @returns {ContentService.TextOutput} JSON response
 */
function handleInit(email) {
  // Validate user
  const user = validateUser(email);
  if (!user) {
    return createResponse({
      error: 'User not authorized',
      message: 'Your email is not registered. Please contact the administrator.'
    }, 403);
  }

  // Load all data
  const locations = getLocations();
  const books = getAllBooks();

  return createResponse({
    success: true,
    user: user,
    locations: locations,
    books: books
  }, 200);
}

/**
 * Validate user by email
 * @param {string} email - User's email address
 * @returns {object|null} User object or null if not found
 */
function validateUser(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);

  if (!usersSheet) {
    Logger.log('Users sheet not found');
    return null;
  }

  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const emailCol = headers.indexOf('Email');
  const nameCol = headers.indexOf('Name');
  const defaultLocCol = headers.indexOf('Default_location');

  if (emailCol === -1) {
    Logger.log('Email column not found in Users sheet');
    return null;
  }

  // Normalize email for comparison
  const normalizedEmail = email.toString().toLowerCase().trim();

  // Search for user (skip header row)
  for (let i = 1; i < data.length; i++) {
    const sheetEmail = data[i][emailCol].toString().toLowerCase().trim();

    if (sheetEmail === normalizedEmail) {
      return {
        email: data[i][emailCol],
        name: nameCol !== -1 ? data[i][nameCol] : '',
        default_location: defaultLocCol !== -1 ? data[i][defaultLocCol] : ''
      };
    }
  }

  return null;
}

/**
 * Get all locations from Locations sheet
 * @returns {Array} Array of location objects
 */
function getLocations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const locationsSheet = ss.getSheetByName(LOCATIONS_SHEET_NAME);

  if (!locationsSheet) {
    Logger.log('Locations sheet not found');
    return [];
  }

  const data = locationsSheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const codeCol = headers.indexOf('Location_code');
  const nameCol = headers.indexOf('Location_name');

  if (codeCol === -1 || nameCol === -1) {
    Logger.log('Location columns not found');
    return [];
  }

  const locations = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeCol] || data[i][nameCol]) {
      locations.push({
        code: data[i][codeCol].toString().trim(),
        name: data[i][nameCol].toString().trim()
      });
    }
  }

  return locations;
}

/**
 * Get all books from Books sheet
 * @returns {Array} Array of book objects
 */
function getAllBooks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const booksSheet = ss.getSheetByName(BOOKS_SHEET_NAME);

  if (!booksSheet) {
    throw new Error('Books sheet not found');
  }

  const data = booksSheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices for standard fields
  const codeCol = headers.indexOf('Book_code');
  const seriesCol = headers.indexOf('Book_series');
  const nameCol = headers.indexOf('Book_name');
  const volumeCol = headers.indexOf('Volume');
  const totalCol = headers.indexOf('Total');
  const updateCol = headers.indexOf('Last_update');

  if (codeCol === -1) {
    throw new Error('Book_code column not found in Books sheet');
  }

  // Find location columns (any column that's not a standard field)
  const standardCols = ['Book_code', 'Book_series', 'Book_name', 'Volume', 'Total', 'Last_update'];
  const locationCols = [];
  for (let i = 0; i < headers.length; i++) {
    const headerName = headers[i].toString().trim();
    if (!standardCols.includes(headerName) && headerName) {
      locationCols.push({ index: i, name: headerName });
    }
  }

  const books = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][codeCol]) continue; // Skip empty rows

    const book = {
      Book_code: data[i][codeCol],
      Book_series: seriesCol !== -1 ? data[i][seriesCol] : '',
      Book_name: nameCol !== -1 ? data[i][nameCol] : '',
      Volume: volumeCol !== -1 ? data[i][volumeCol] : '',
      Total: totalCol !== -1 ? data[i][totalCol] : 0,
      Last_update: updateCol !== -1 ? data[i][updateCol] : '',
      locations: {}
    };

    // Add location-specific quantities
    for (const loc of locationCols) {
      book.locations[loc.name] = data[i][loc.index] || 0;
    }

    books.push(book);
  }

  return books;
}

/**
 * Handle POST requests - Add transaction
 * Body: JSON with { book_code, qty, location, user, comments }
 * Returns: JSON with updated quantities or error
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

    // Add transaction and update location-specific inventory
    const result = addTransaction({
      book_code: data.book_code,
      qty: qty,
      location: data.location.toString().trim(),
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
 * Look up a book by Book_code
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
  const codeCol = headers.indexOf('Book_code');
  const seriesCol = headers.indexOf('Book_series');
  const nameCol = headers.indexOf('Book_name');
  const volumeCol = headers.indexOf('Volume');
  const totalCol = headers.indexOf('Total');
  const updateCol = headers.indexOf('Last_update');

  if (codeCol === -1) {
    throw new Error('Book_code column not found in Books sheet');
  }

  // Find location columns
  const standardCols = ['Book_code', 'Book_series', 'Book_name', 'Volume', 'Total', 'Last_update'];
  const locationCols = [];
  for (let i = 0; i < headers.length; i++) {
    const headerName = headers[i].toString().trim();
    if (!standardCols.includes(headerName) && headerName) {
      locationCols.push({ index: i, name: headerName });
    }
  }

  // Normalize book code for comparison
  const normalizedSearchCode = bookCode.toString().replace(/[-\s]/g, '').toUpperCase();

  // Search for book (skip header row)
  for (let i = 1; i < data.length; i++) {
    const sheetCode = data[i][codeCol].toString().replace(/[-\s]/g, '').toUpperCase();

    if (sheetCode === normalizedSearchCode) {
      const book = {
        Book_code: data[i][codeCol],
        Book_series: seriesCol !== -1 ? data[i][seriesCol] : '',
        Book_name: nameCol !== -1 ? data[i][nameCol] : '',
        Volume: volumeCol !== -1 ? data[i][volumeCol] : '',
        Total: totalCol !== -1 ? data[i][totalCol] : 0,
        Last_update: updateCol !== -1 ? data[i][updateCol] : '',
        locations: {},
        rowIndex: i + 1 // Store for updating later (1-based)
      };

      // Add location-specific quantities
      for (const loc of locationCols) {
        book.locations[loc.name] = data[i][loc.index] || 0;
      }

      return book;
    }
  }

  return null;
}

/**
 * Add a transaction and update location-specific inventory
 * @param {object} transaction - Transaction data
 * @returns {object} Result with new quantities
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
    transaction.location,  // This is the location name
    timestamp,
    transaction.user,
    transaction.comments
  ]);

  // Find the location column in Books sheet
  const booksData = booksSheet.getDataRange().getValues();
  const headers = booksData[0];

  // Find the column for this location (trim headers for comparison)
  let locationColIndex = -1;
  let updateColIndex = -1;
  for (let i = 0; i < headers.length; i++) {
    const headerName = headers[i].toString().trim();
    if (headerName === transaction.location) {
      locationColIndex = i;
    }
    if (headerName === 'Last_update') {
      updateColIndex = i;
    }
  }

  if (locationColIndex === -1) {
    throw new Error('Location column "' + transaction.location + '" not found in Books sheet');
  }

  // Calculate new quantity for this location
  const currentLocationQty = book.locations[transaction.location] || 0;
  const newLocationQty = currentLocationQty + transaction.qty;

  // Update the location-specific column
  booksSheet.getRange(book.rowIndex, locationColIndex + 1).setValue(newLocationQty);

  // Update Last_update timestamp
  if (updateColIndex !== -1) {
    booksSheet.getRange(book.rowIndex, updateColIndex + 1).setValue(timestamp);
  }

  // Prepare updated locations object
  const updatedLocations = { ...book.locations };
  updatedLocations[transaction.location] = newLocationQty;

  return {
    success: true,
    book_code: transaction.book_code,
    book_name: book.Book_name,
    location: transaction.location,
    old_qty: currentLocationQty,
    new_qty: newLocationQty,
    transaction_qty: transaction.qty,
    locations: updatedLocations,
    timestamp: timestamp
  };
}

/**
 * Create a JSON response
 * @param {object} data - Data to return
 * @param {number} status - HTTP status code (for logging only)
 * @returns {ContentService.TextOutput}
 */
function createResponse(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Test function - Validate user
 */
function testValidateUser() {
  const user = validateUser('test@example.com');
  Logger.log(user);
}

/**
 * Test function - Get locations
 */
function testGetLocations() {
  const locations = getLocations();
  Logger.log(locations);
}

/**
 * Test function - Get all books
 */
function testGetAllBooks() {
  const books = getAllBooks();
  Logger.log(books);
}

/**
 * Test function - Full init
 */
function testInit() {
  const result = handleInit('test@example.com');
  Logger.log(result);
}
