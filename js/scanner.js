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

      // Get the back camera (environment facing)
      // On mobile, this is usually the rear camera
      let cameraId = cameras[cameras.length - 1].id;

      // Try to find environment-facing camera
      for (let camera of cameras) {
        if (camera.label.toLowerCase().includes('back') ||
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')) {
          cameraId = camera.id;
          break;
        }
      }

      // Configure scanner for ISBN barcodes
      const config = {
        fps: 5, // Lower FPS for better performance (reduces setTimeout warnings)
        qrbox: { width: 350, height: 120 }, // Wide box for ISBN barcodes
        aspectRatio: 1.777778, // 16:9 aspect ratio
        disableFlip: false // Allow scanning from any orientation
        // Removed formatsToSupport to allow ALL formats
      };

      // Start scanning
      console.log('Starting scanner with config:', config);
      await this.scanner.start(
        cameraId,
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
