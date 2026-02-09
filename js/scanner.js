/**
 * Barcode Scanner Module
 * Handles barcode scanning using html5-qrcode library
 */

class BarcodeScanner {
  constructor() {
    this.scanner = null;
    this.isScanning = false;
    this.onScanSuccess = null;
    this.onScanError = null;
  }

  /**
   * Initialize the scanner
   * @param {Function} successCallback - Called when barcode is successfully scanned
   * @param {Function} errorCallback - Called when an error occurs
   */
  init(successCallback, errorCallback) {
    this.onScanSuccess = successCallback;
    this.onScanError = errorCallback;
  }

  /**
   * Start scanning
   */
  async start() {
    if (this.isScanning) {
      console.log('Scanner already running');
      return;
    }

    try {
      // Check if camera is available
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Initialize scanner if not already done
      if (!this.scanner) {
        this.scanner = new Html5Qrcode('qr-reader');
      }

      // Configure scanner for ISBN barcodes
      const config = {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          // Use 80% of width for scanning area — helps detect from further away
          let width = Math.floor(viewfinderWidth * 0.8);
          let height = Math.floor(width * 0.35);
          return { width: width, height: height };
        },
        aspectRatio: 1.777778,
        disableFlip: false
      };

      // Start scanning with video constraints instead of cameraId
      console.log('Starting scanner with config:', config);
      await this.scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText, decodedResult) => {
          // Success callback - barcode detected
          console.log('✅ Barcode scanned successfully!');
          console.log('Code:', decodedText);
          console.log('Format:', decodedResult.result.format.formatName);
          if (this.onScanSuccess) {
            this.onScanSuccess(decodedText, decodedResult);
          }
        },
        (errorMessage) => {
          // Error callback - typically means no barcode in frame (not a real error)
          // Only log occasionally to help debug
          if (Math.random() < 0.01) {
            console.log('Scanning... (no barcode detected yet)');
          }
        }
      );

      this.isScanning = true;
      console.log('Scanner started successfully');

      // Apply continuous autofocus on the active video track (critical for iPhone)
      this._applyContinuousFocus();

    } catch (error) {
      console.error('Error starting scanner:', error);
      this.isScanning = false;
      if (this.onScanError) {
        this.onScanError(error.message || 'Failed to start scanner');
      }
      throw error;
    }
  }

  /**
   * Apply continuous autofocus on the running video track.
   * iPhone cameras default to single-shot autofocus which causes blur at close range.
   */
  _applyContinuousFocus() {
    try {
      const videoElement = document.querySelector('#qr-reader video');
      if (!videoElement || !videoElement.srcObject) return;

      const track = videoElement.srcObject.getVideoTracks()[0];
      if (!track) return;

      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        }).then(() => {
          console.log('Continuous autofocus enabled');
        }).catch(err => {
          console.log('Could not set continuous focus:', err.message);
        });
      } else {
        console.log('Continuous focus not supported by this camera');
      }
    } catch (e) {
      console.log('Focus setting skipped:', e.message);
    }
  }

  /**
   * Stop scanning
   */
  async stop() {
    if (!this.isScanning || !this.scanner) {
      return;
    }

    try {
      await this.scanner.stop();
      this.isScanning = false;
      console.log('Scanner stopped');
    } catch (error) {
      console.error('Error stopping scanner:', error);
      this.isScanning = false;
    }
  }

  /**
   * Check if camera is supported on this device/browser
   * @returns {Promise<boolean>}
   */
  static async isCameraSupported() {
    try {
      const cameras = await Html5Qrcode.getCameras();
      return cameras && cameras.length > 0;
    } catch (error) {
      console.error('Camera check failed:', error);
      return false;
    }
  }

  /**
   * Request camera permission
   * @returns {Promise<boolean>}
   */
  static async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Get current scanning state
   * @returns {boolean}
   */
  isActive() {
    return this.isScanning;
  }
}

// Export for use in other modules
window.BarcodeScanner = BarcodeScanner;
