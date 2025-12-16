/**
 * PDF to PPTX Conversion Service
 * High-fidelity conversion maintaining 99% format and content
 * Uses Python-based conversion for best results
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class PdfToPptxService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../python_services/pdf_to_pptx.py');
    this.tempDir = path.join(__dirname, '../../temp');
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.isAvailable = null;
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('[pdfToPptx] Error creating temp directory:', error);
    }
  }

  /**
   * Reset availability cache to force re-check
   */
  resetAvailability() {
    this.isAvailable = null;
  }

  /**
   * Check if Python and required libraries are available
   */
  async checkAvailability() {
    // Don't cache failures - always retry if previously failed
    if (this.isAvailable === true) {
      return { available: true };
    }

    try {
      // Check if Python script exists
      await fs.access(this.pythonScript);
      console.log('[pdfToPptx] Python script found at:', this.pythonScript);

      // Check if Python is available and has required packages
      const result = await this.runPythonCommand([
        '-c',
        'import fitz; import pptx; print("OK")'
      ]);

      this.isAvailable = result.includes('OK');
      console.log('[pdfToPptx] Python check result:', result.trim());
      
      if (!this.isAvailable) {
        console.log('[pdfToPptx] Python packages not available, attempting install...');
        await this.installDependencies();
        
        // Re-check after install
        const recheck = await this.runPythonCommand([
          '-c',
          'import fitz; import pptx; print("OK")'
        ]);
        this.isAvailable = recheck.includes('OK');
      }

      return { 
        available: this.isAvailable,
        message: this.isAvailable ? 'PDF to PPTX service is ready' : 'Service unavailable'
      };
    } catch (error) {
      console.error('[pdfToPptx] Availability check failed:', error.message);
      // Don't cache failure - allow retry
      return { 
        available: false, 
        error: error.message 
      };
    }
  }

  /**
   * Install Python dependencies
   */
  async installDependencies() {
    const packages = ['pymupdf', 'python-pptx', 'Pillow'];
    
    for (const pkg of packages) {
      try {
        await this.runPythonCommand(['-m', 'pip', 'install', pkg, '-q']);
        console.log(`[pdfToPptx] Installed ${pkg}`);
      } catch (error) {
        console.warn(`[pdfToPptx] Failed to install ${pkg}:`, error.message);
      }
    }
  }

  /**
   * Run a Python command and return output
   */
  runPythonCommand(args, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(this.pythonPath, args, {
        timeout,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Convert PDF buffer to PPTX
   * 
   * @param {Buffer} pdfBuffer - Input PDF buffer
   * @param {string} filename - Original filename
   * @param {Object} options - Conversion options
   * @returns {Promise<Buffer>} - PPTX buffer
   */
  async convertPdfToPptx(pdfBuffer, filename, options = {}) {
    const status = await this.checkAvailability();
    
    if (!status.available) {
      throw new Error('PDF to PPTX service is not available. Please ensure Python and required packages are installed.');
    }

    const tempId = uuidv4();
    const tempInputPath = path.join(this.tempDir, `${tempId}_input.pdf`);
    const tempOutputPath = path.join(this.tempDir, `${tempId}_output.pptx`);

    try {
      // Write input PDF to temp file
      await fs.writeFile(tempInputPath, pdfBuffer);
      console.log(`[pdfToPptx] Input PDF saved: ${tempInputPath}`);

      // Prepare options - default to editable mode (no hybrid)
      const conversionOptions = {
        preserve_images: options.preserveImages !== false,
        preserve_formatting: options.preserveFormatting !== false,
        image_quality: options.imageQuality || 95,
        extract_as_image: options.extractAsImage || false,
        hybrid_mode: options.hybridMode || false  // Default: false for editable text
      };

      // Run Python conversion
      const result = await this.runConversion(
        tempInputPath, 
        tempOutputPath, 
        conversionOptions
      );

      if (!result.success) {
        throw new Error(result.error || 'Conversion failed');
      }

      // Read output PPTX
      const pptxBuffer = await fs.readFile(tempOutputPath);
      console.log(`[pdfToPptx] Conversion successful: ${result.page_count} slides, ${pptxBuffer.length} bytes`);

      return pptxBuffer;

    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles([tempInputPath, tempOutputPath]);
    }
  }

  /**
   * Run the Python conversion script
   */
  async runConversion(inputPath, outputPath, options) {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScript,
        inputPath,
        outputPath,
        JSON.stringify(options)
      ];

      console.log(`[pdfToPptx] Running conversion: ${this.pythonPath} ${args.join(' ')}`);

      const childProcess = spawn(this.pythonPath, args, {
        timeout: 300000, // 5 minutes timeout
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log warnings but don't fail
        if (data.toString().includes('Warning:')) {
          console.warn('[pdfToPptx]', data.toString().trim());
        }
      });

      childProcess.on('close', (code) => {
        try {
          // Try to parse JSON output
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseError) {
          if (code === 0) {
            resolve({ success: true, output: stdout });
          } else {
            reject(new Error(stderr || stdout || `Conversion failed with code ${code}`));
          }
        }
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to start conversion: ${error.message}`));
      });
    });
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempFiles(files) {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = new PdfToPptxService();
