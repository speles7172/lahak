/**
 * Google Sheets API Module
 * Handles communication with Google Apps Script backend
 */

class SheetsAPI {
  constructor() {
    // IMPORTANT: Replace this with your Google Apps Script Web App URL
    // After deploying Code.gs as a Web App, paste the URL here
    this.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxn1xzfNz3wko28yTRsKSvuXcKaBSTmjQ-gGnHx5XRwQmIwt5s3URjKrNlAnTUj0g8/exec';

    // Check if URL is configured
    if (this.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      console.warn('⚠️ Google Apps Script URL not configured! Please update SCRIPT_URL in sheets-api.js');
    }
  }

  /**
   * Set the Google Apps Script URL
   * @param {string} url - The deployed Web App URL
   */
  setScriptURL(url) {
    this.SCRIPT_URL = url;
    console.log('✓ Google Apps Script URL configured');
  }

  /**
   * Look up a book by book code
   * @param {string} bookCode - The book code to look up
   * @returns {Promise<object>} Book details
   */
  async lookupBook(bookCode) {
    if (!this.isConfigured()) {
      throw new Error('Google Apps Script URL not configured');
    }

    try {
      const url = `${this.SCRIPT_URL}?code=${encodeURIComponent(bookCode)}`;

      // Simple GET request - no preflight needed
      const response = await fetch(url, {
        redirect: 'follow'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup book');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;

    } catch (error) {
      console.error('Error looking up book:', error);
      throw error;
    }
  }

  /**
   * Submit a transaction
   * @param {object} transaction - Transaction data
   * @param {string} transaction.book_code - Book code
   * @param {number} transaction.qty - Quantity (positive for in, negative for out)
   * @param {string} transaction.location - Location
   * @param {string} transaction.user - User name
   * @param {string} transaction.comments - Optional comments
   * @returns {Promise<object>} Result with updated total
   */
  async submitTransaction(transaction) {
    if (!this.isConfigured()) {
      throw new Error('Google Apps Script URL not configured');
    }

    // Validate required fields
    if (!transaction.book_code) {
      throw new Error('book_code is required');
    }
    if (transaction.qty === undefined || transaction.qty === null) {
      throw new Error('qty is required');
    }
    if (!transaction.location) {
      throw new Error('location is required');
    }
    if (!transaction.user) {
      throw new Error('user is required');
    }

    try {
      const response = await fetch(this.SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({
          book_code: transaction.book_code,
          qty: parseFloat(transaction.qty),
          location: transaction.location,
          user: transaction.user,
          comments: transaction.comments || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit transaction');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;

    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Check if the API is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' &&
           this.SCRIPT_URL.trim() !== '';
  }

  /**
   * Test the connection to Google Apps Script
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Try to lookup a dummy book code to test connection
      await fetch(this.SCRIPT_URL + '?code=TEST', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Create global instance
window.sheetsAPI = new SheetsAPI();

// Expose for debugging
window.SheetsAPI = SheetsAPI;
