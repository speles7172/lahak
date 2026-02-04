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
      console.warn('Google Apps Script URL not configured! Please update SCRIPT_URL in sheets-api.js');
    }
  }

  /**
   * Set the Google Apps Script URL
   * @param {string} url - The deployed Web App URL
   */
  setScriptURL(url) {
    this.SCRIPT_URL = url;
    console.log('Google Apps Script URL configured');
  }

  /**
   * Load initial data (user validation, locations, books)
   * This is called once after Google Sign-In to load all data into memory
   * @param {string} email - User's email from Google Sign-In
   * @returns {Promise<object>} Object with user, locations, and books
   */
  async loadInitData(email) {
    if (!this.isConfigured()) {
      throw new Error('Google Apps Script URL not configured');
    }

    try {
      const url = `${this.SCRIPT_URL}?action=init&email=${encodeURIComponent(email)}`;

      const response = await fetch(url, {
        redirect: 'follow'
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || data.error);
      }

      return data;

    } catch (error) {
      console.error('Error loading init data:', error);
      throw error;
    }
  }

  /**
   * Submit a transaction
   * @param {object} transaction - Transaction data
   * @param {string} transaction.book_code - Book code
   * @param {number} transaction.qty - Quantity (positive for in, negative for out)
   * @param {string} transaction.location - Location name
   * @param {string} transaction.user - User name
   * @param {string} transaction.comments - Optional comments
   * @returns {Promise<object>} Result with updated quantities
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
}

// Create global instance
window.sheetsAPI = new SheetsAPI();

// Expose for debugging
window.SheetsAPI = SheetsAPI;
