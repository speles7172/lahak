/**
 * Main Application Logic
 * Orchestrates authentication, scanner, API calls, and UI updates
 */

// Application state
const appState = {
  // Authentication
  isAuthenticated: false,
  userEmail: null,

  // Cached data (loaded once on login)
  user: null,         // { email, name, default_location }
  locations: [],      // [{ code, name }, ...]
  books: new Map(),   // Map<normalized_code, book_object> for O(1) lookup

  // Current transaction
  currentBook: null,
  scanner: null,
  isLoading: false
};

// DOM elements
const elements = {
  // Login section
  loginSection: document.getElementById('login-section'),
  authError: document.getElementById('auth-error'),

  // User info
  userInfo: document.getElementById('user-info'),
  userDisplayName: document.getElementById('user-display-name'),
  signOutBtn: document.getElementById('sign-out-btn'),

  // Main app
  appMain: document.getElementById('app-main'),

  // Scanner controls
  startScanBtn: document.getElementById('start-scan-btn'),
  stopScanBtn: document.getElementById('stop-scan-btn'),
  scannerContainer: document.getElementById('scanner-container'),
  manualCodeInput: document.getElementById('manual-code-input'),
  lookupBtn: document.getElementById('lookup-btn'),

  // Book display
  bookSection: document.getElementById('book-section'),
  bookCode: document.getElementById('book-code'),
  bookName: document.getElementById('book-name'),
  bookSeries: document.getElementById('book-series'),
  bookVolume: document.getElementById('book-volume'),
  bookLocations: document.getElementById('book-locations'),

  // Transaction form
  transactionSection: document.getElementById('transaction-section'),
  transactionForm: document.getElementById('transaction-form'),
  qtyInput: document.getElementById('qty-input'),
  locationSelect: document.getElementById('location-select'),
  commentsInput: document.getElementById('comments-input'),

  // Status and loading
  statusMessage: document.getElementById('status-message'),
  loadingSpinner: document.getElementById('loading-spinner')
};

/**
 * Handle Google Sign-In callback
 * Called by Google Identity Services when user signs in
 */
function handleGoogleSignIn(response) {
  // Decode the JWT token to get user info
  const payload = parseJwt(response.credential);

  if (!payload || !payload.email) {
    showAuthError('Failed to get user information from Google.');
    return;
  }

  appState.userEmail = payload.email;

  // Show loading
  setLoading(true);
  hideAuthError();

  // Load initial data from backend
  loadInitialData(payload.email);
}

/**
 * Parse JWT token
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return null;
  }
}

/**
 * Load initial data from backend
 * This is called once after Google Sign-In
 */
async function loadInitialData(email) {
  try {
    const data = await window.sheetsAPI.loadInitData(email);

    // Store user info
    appState.user = data.user;
    appState.locations = data.locations;

    // Build books map for O(1) lookup
    appState.books.clear();
    for (const book of data.books) {
      const normalizedCode = normalizeBookCode(book.Book_code);
      appState.books.set(normalizedCode, book);
    }

    // Mark as authenticated
    appState.isAuthenticated = true;

    // Update UI
    showMainApp();
    populateLocationsDropdown();

    console.log('Initial data loaded:', {
      user: appState.user,
      locationsCount: appState.locations.length,
      booksCount: appState.books.size
    });

  } catch (error) {
    console.error('Failed to load initial data:', error);

    if (error.message.includes('not authorized') || error.message.includes('not registered')) {
      showAuthError(error.message);
    } else {
      showAuthError('Failed to connect to the server. Please try again.');
    }
  } finally {
    setLoading(false);
  }
}

/**
 * Normalize book code for comparison
 */
function normalizeBookCode(code) {
  return code.toString().replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Show authentication error
 */
function showAuthError(message) {
  elements.authError.innerHTML = `<p>${message}</p><p>Please contact the administrator to request access.</p>`;
  elements.authError.style.display = 'block';
}

/**
 * Hide authentication error
 */
function hideAuthError() {
  elements.authError.style.display = 'none';
}

/**
 * Show main app after successful authentication
 */
function showMainApp() {
  // Hide login section
  elements.loginSection.style.display = 'none';

  // Show user info in header
  elements.userDisplayName.textContent = appState.user.name || appState.user.email;
  elements.userInfo.style.display = 'flex';

  // Show main app
  elements.appMain.style.display = 'block';

  // Initialize scanner
  initScanner();
}

/**
 * Populate locations dropdown from cached data
 */
function populateLocationsDropdown() {
  const select = elements.locationSelect;

  // Clear existing options (except the placeholder)
  select.innerHTML = '<option value="">Select a location...</option>';

  // Add locations
  for (const location of appState.locations) {
    const option = document.createElement('option');
    option.value = location.name;
    option.textContent = location.name;
    select.appendChild(option);
  }

  // Set default location if user has one
  if (appState.user.default_location) {
    select.value = appState.user.default_location;
  }
}

/**
 * Handle sign out
 */
function handleSignOut() {
  // Clear state
  appState.isAuthenticated = false;
  appState.userEmail = null;
  appState.user = null;
  appState.locations = [];
  appState.books.clear();
  appState.currentBook = null;

  // Reset UI
  elements.appMain.style.display = 'none';
  elements.userInfo.style.display = 'none';
  elements.loginSection.style.display = 'block';
  hideAuthError();
  hideBookDisplay();
  hideTransactionForm();

  // Revoke Google session
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }

  // Reload page to reset Google Sign-In
  window.location.reload();
}

/**
 * Initialize scanner
 */
function initScanner() {
  appState.scanner = new BarcodeScanner();
  appState.scanner.init(onScanSuccess, onScanError);

  // Set up event listeners
  setupEventListeners();

  // Check if API is configured
  if (!window.sheetsAPI.isConfigured()) {
    showStatus('Please configure Google Apps Script URL in sheets-api.js', 'warning', 0);
  }

  console.log('App initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Sign out button
  elements.signOutBtn.addEventListener('click', handleSignOut);

  // Start scan button
  elements.startScanBtn.addEventListener('click', startScanning);

  // Stop scan button
  elements.stopScanBtn.addEventListener('click', stopScanning);

  // Manual lookup button
  elements.lookupBtn.addEventListener('click', () => {
    const code = elements.manualCodeInput.value.trim();
    if (code) {
      lookupBook(code);
    } else {
      showStatus('Please enter a book code', 'error');
    }
  });

  // Enter key in manual input
  elements.manualCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      elements.lookupBtn.click();
    }
  });

  // Transaction form submit
  elements.transactionForm.addEventListener('submit', handleTransactionSubmit);
}

/**
 * Start barcode scanning
 */
async function startScanning() {
  try {
    // Check camera support
    const isSupported = await BarcodeScanner.isCameraSupported();
    if (!isSupported) {
      showStatus('No camera found on this device. Please use manual entry.', 'error');
      return;
    }

    // Show scanner UI
    elements.scannerContainer.style.display = 'block';
    elements.startScanBtn.style.display = 'none';

    // Start scanner
    await appState.scanner.start();
    showStatus('Scanner active - point camera at barcode', 'info', 3000);

  } catch (error) {
    console.error('Failed to start scanner:', error);
    showStatus(`Failed to start scanner: ${error.message}`, 'error');
    elements.scannerContainer.style.display = 'none';
    elements.startScanBtn.style.display = 'block';
  }
}

/**
 * Stop barcode scanning
 */
async function stopScanning() {
  try {
    await appState.scanner.stop();
    elements.scannerContainer.style.display = 'none';
    elements.startScanBtn.style.display = 'block';
    showStatus('Scanner stopped', 'info', 2000);
  } catch (error) {
    console.error('Error stopping scanner:', error);
  }
}

/**
 * Called when barcode is successfully scanned
 */
function onScanSuccess(decodedText, decodedResult) {
  console.log('Barcode detected:', decodedText);

  // Stop scanner
  stopScanning();

  // Look up the book
  lookupBook(decodedText);

  // Fill manual input for reference
  elements.manualCodeInput.value = decodedText;
}

/**
 * Called when scanner encounters an error
 */
function onScanError(errorMessage) {
  showStatus(`Scanner error: ${errorMessage}`, 'error');
}

/**
 * Look up a book by code (from cached data - NO API call)
 */
function lookupBook(bookCode) {
  hideStatus();

  const normalizedCode = normalizeBookCode(bookCode);
  const book = appState.books.get(normalizedCode);

  if (!book) {
    appState.currentBook = null;
    hideBookDisplay();
    hideTransactionForm();
    showStatus(`Book code "${bookCode}" not found in inventory`, 'error');
    return;
  }

  appState.currentBook = book;
  displayBook(book);
  showTransactionForm();
  showStatus('Book found!', 'success', 2000);
}

/**
 * Display book information
 */
function displayBook(book) {
  elements.bookCode.textContent = book.Book_code || '';
  elements.bookName.textContent = book.Book_name || 'N/A';
  elements.bookSeries.textContent = book.Book_series || 'N/A';
  elements.bookVolume.textContent = book.Volume || 'N/A';

  // Display location-specific quantities
  const locationsHtml = [];
  if (book.locations) {
    for (const [locName, qty] of Object.entries(book.locations)) {
      locationsHtml.push(`
        <div class="info-row location-qty">
          <span class="label">${locName}:</span>
          <span class="value highlight">${qty || 0}</span>
        </div>
      `);
    }
  }
  elements.bookLocations.innerHTML = locationsHtml.join('');

  elements.bookSection.style.display = 'block';
}

/**
 * Hide book display
 */
function hideBookDisplay() {
  elements.bookSection.style.display = 'none';
}

/**
 * Show transaction form
 */
function showTransactionForm() {
  elements.transactionSection.style.display = 'block';

  // Reset form but keep location
  elements.qtyInput.value = '';
  elements.commentsInput.value = '';

  // Focus on quantity input for quick entry
  elements.qtyInput.focus();
}

/**
 * Hide transaction form
 */
function hideTransactionForm() {
  elements.transactionSection.style.display = 'none';
}

/**
 * Handle transaction form submission
 */
async function handleTransactionSubmit(e) {
  e.preventDefault();

  if (!appState.currentBook) {
    showStatus('Please look up a book first', 'error');
    return;
  }

  if (appState.isLoading) {
    return;
  }

  // Get form data
  const qty = parseFloat(elements.qtyInput.value);
  const location = elements.locationSelect.value;
  const comments = elements.commentsInput.value.trim();

  // Validate
  if (isNaN(qty)) {
    showStatus('Please enter a valid quantity', 'error');
    elements.qtyInput.focus();
    return;
  }

  if (!location) {
    showStatus('Please select a location', 'error');
    elements.locationSelect.focus();
    return;
  }

  // Prepare transaction
  const transaction = {
    book_code: appState.currentBook.Book_code,
    qty: qty,
    location: location,
    user: appState.user.name || appState.user.email,
    comments: comments
  };

  // Submit transaction (THIS IS THE ONLY API CALL DURING NORMAL USE)
  setLoading(true);
  hideStatus();

  try {
    showStatus('Submitting transaction...', 'info', 0);

    const result = await window.sheetsAPI.submitTransaction(transaction);

    console.log('Transaction result:', result);

    // Update cached book data
    if (appState.currentBook.locations) {
      appState.currentBook.locations[location] = result.new_qty;
    }

    // Re-display book with updated quantities
    displayBook(appState.currentBook);

    // Show success message
    const qtyText = qty > 0 ? `+${qty}` : qty;
    showStatus(
      `Transaction recorded: ${qtyText} ${result.book_name} at ${location} (New qty: ${result.new_qty})`,
      'success',
      5000
    );

    // Reset form for next transaction
    resetTransactionForm();

  } catch (error) {
    console.error('Transaction error:', error);
    showStatus(`Failed to submit transaction: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Reset transaction form
 */
function resetTransactionForm() {
  elements.qtyInput.value = '';
  elements.commentsInput.value = '';
  // Keep location selected for convenience

  // Hide book and form, ready for next scan
  hideBookDisplay();
  hideTransactionForm();
  appState.currentBook = null;

  // Clear manual input
  elements.manualCodeInput.value = '';

  // Focus back on manual input for next entry
  elements.manualCodeInput.focus();
}

/**
 * Show loading spinner
 */
function setLoading(isLoading) {
  appState.isLoading = isLoading;
  elements.loadingSpinner.style.display = isLoading ? 'flex' : 'none';

  // Disable form inputs while loading
  if (elements.transactionForm) {
    const formElements = elements.transactionForm.querySelectorAll('input, textarea, select, button');
    formElements.forEach(el => {
      el.disabled = isLoading;
    });
  }

  if (elements.startScanBtn) elements.startScanBtn.disabled = isLoading;
  if (elements.lookupBtn) elements.lookupBtn.disabled = isLoading;
  if (elements.manualCodeInput) elements.manualCodeInput.disabled = isLoading;
}

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {number} duration - Auto-hide after milliseconds (0 = don't hide)
 */
function showStatus(message, type = 'info', duration = 5000) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message status-${type}`;
  elements.statusMessage.style.display = 'block';

  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(hideStatus, duration);
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  elements.statusMessage.style.display = 'none';
}

// Expose for debugging and Google Sign-In callback
window.appState = appState;
window.lookupBook = lookupBook;
window.handleGoogleSignIn = handleGoogleSignIn;
