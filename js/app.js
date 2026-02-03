/**
 * Main Application Logic
 * Orchestrates scanner, API calls, and UI updates
 */

// Application state
const appState = {
  currentBook: null,
  scanner: null,
  isLoading: false,
  userName: localStorage.getItem('inventory_user_name') || ''
};

// DOM elements
const elements = {
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
  bookTotal: document.getElementById('book-total'),

  // Transaction form
  transactionSection: document.getElementById('transaction-section'),
  transactionForm: document.getElementById('transaction-form'),
  qtyInput: document.getElementById('qty-input'),
  locationInput: document.getElementById('location-input'),
  userInput: document.getElementById('user-input'),
  commentsInput: document.getElementById('comments-input'),

  // Status and loading
  statusMessage: document.getElementById('status-message'),
  loadingSpinner: document.getElementById('loading-spinner')
};

/**
 * Initialize the application
 */
function initApp() {
  console.log('Initializing Inventory Manager...');

  // Initialize scanner
  appState.scanner = new BarcodeScanner();
  appState.scanner.init(onScanSuccess, onScanError);

  // Set up event listeners
  setupEventListeners();

  // Restore user name from localStorage
  if (appState.userName) {
    elements.userInput.value = appState.userName;
  }

  // Check if API is configured
  if (!window.sheetsAPI.isConfigured()) {
    showStatus('⚠️ Please configure Google Apps Script URL in sheets-api.js', 'warning', 0);
  }

  console.log('✓ App initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
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

  // Save user name to localStorage when changed
  elements.userInput.addEventListener('change', () => {
    const userName = elements.userInput.value.trim();
    if (userName) {
      localStorage.setItem('inventory_user_name', userName);
      appState.userName = userName;
    }
  });
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
    showStatus('📷 Scanner active - point camera at barcode', 'info', 3000);

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
 * Look up a book by code
 */
async function lookupBook(bookCode) {
  if (appState.isLoading) {
    return;
  }

  setLoading(true);
  hideStatus();

  try {
    showStatus('Looking up book...', 'info', 0);

    const book = await window.sheetsAPI.lookupBook(bookCode);

    appState.currentBook = book;
    displayBook(book);
    showTransactionForm();

    showStatus('✓ Book found!', 'success', 3000);

  } catch (error) {
    console.error('Lookup error:', error);
    appState.currentBook = null;
    hideBookDisplay();
    hideTransactionForm();

    if (error.message.includes('Book not found')) {
      showStatus(`❌ Book code "${bookCode}" not found in inventory`, 'error');
    } else if (error.message.includes('not configured')) {
      showStatus('⚠️ Google Apps Script URL not configured', 'warning');
    } else {
      showStatus(`Error: ${error.message}`, 'error');
    }
  } finally {
    setLoading(false);
  }
}

/**
 * Display book information
 */
function displayBook(book) {
  elements.bookCode.textContent = book.book_code || '';
  elements.bookName.textContent = book.book_name || 'N/A';
  elements.bookSeries.textContent = book.book_series || 'N/A';
  elements.bookTotal.textContent = book.total !== undefined ? book.total : '0';

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
  const location = elements.locationInput.value.trim();
  const user = elements.userInput.value.trim();
  const comments = elements.commentsInput.value.trim();

  // Validate
  if (isNaN(qty)) {
    showStatus('Please enter a valid quantity', 'error');
    elements.qtyInput.focus();
    return;
  }

  if (!location) {
    showStatus('Please enter a location', 'error');
    elements.locationInput.focus();
    return;
  }

  if (!user) {
    showStatus('Please enter your name', 'error');
    elements.userInput.focus();
    return;
  }

  // Prepare transaction
  const transaction = {
    book_code: appState.currentBook.book_code,
    qty: qty,
    location: location,
    user: user,
    comments: comments
  };

  // Submit transaction
  setLoading(true);
  hideStatus();

  try {
    showStatus('Submitting transaction...', 'info', 0);

    const result = await window.sheetsAPI.submitTransaction(transaction);

    console.log('Transaction result:', result);

    // Update displayed total
    elements.bookTotal.textContent = result.new_total;

    // Show success message
    const qtyText = qty > 0 ? `+${qty}` : qty;
    showStatus(
      `✓ Transaction recorded: ${qtyText} ${result.book_name} (New total: ${result.new_total})`,
      'success',
      5000
    );

    // Reset form
    resetTransactionForm();

    // Update current book total
    if (appState.currentBook) {
      appState.currentBook.total = result.new_total;
    }

  } catch (error) {
    console.error('Transaction error:', error);
    showStatus(`❌ Failed to submit transaction: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Reset transaction form
 */
function resetTransactionForm() {
  elements.qtyInput.value = '';
  elements.locationInput.value = '';
  elements.commentsInput.value = '';
  // Don't reset user name - keep it for next transaction

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
  const formElements = elements.transactionForm.querySelectorAll('input, textarea, button');
  formElements.forEach(el => {
    el.disabled = isLoading;
  });

  elements.startScanBtn.disabled = isLoading;
  elements.lookupBtn.disabled = isLoading;
  elements.manualCodeInput.disabled = isLoading;
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Expose for debugging
window.appState = appState;
window.lookupBook = lookupBook;
