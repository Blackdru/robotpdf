/**
 * PDF to Word Conversion Service using pdf2docx Python library
 * Provides exact format preservation for PDF to Word conversion
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class Pdf2DocxService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../python_services/pdf_to_word.py');
    this.tempDir = path.join(__dirname, '../../temp');
    this.isAvailable = null; // Cache availability check
    this.pythonCommand = null;
    this.isWindows = os.platform() === 'win32';
    
    // Virtual environment path for Linux production server
    this.linuxVenvPath = '/home/ubuntu/robotpdf-env';
    this.linuxPythonPath = path.join(this.linuxVenvPath, 'bin', 'python3');
    
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  /**
   * Convert PDF to Word using pdf2docx Python library
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} filename - Original filename
   * @param {Object} options - Conversion options
   * @returns {Promise<Buffer>} - Word document buffer
   */
  async convertPdfToWord(pdfBuffer, filename, options = {}) {
    const tempId = uuidv4();
    const tempInputPath = path.join(this.tempDir, `${tempId}_input.pdf`);
    const tempOutputPath = path.join(this.tempDir, `${tempId}_output.docx`);

    try {
      console.log(`[pdf2docx] Starting conversion for: ${filename}`);
      
      // Write PDF buffer to temp file
      await fs.writeFile(tempInputPath, pdfBuffer);
      console.log(`[pdf2docx] Temp input file created: ${tempInputPath}`);

      // Prepare options JSON
      const optionsJson = JSON.stringify({
        start_page: options.startPage || 0,
        end_page: options.endPage || null
      });

      // Execute Python script
      const result = await this.executePythonScript(tempInputPath, tempOutputPath, optionsJson);

      if (!result.success) {
        throw new Error(result.error || 'PDF to Word conversion failed');
      }

      // Read output file
      const outputBuffer = await fs.readFile(tempOutputPath);
      console.log(`[pdf2docx] Conversion successful. Output size: ${outputBuffer.length} bytes`);

      return outputBuffer;

    } catch (error) {
      console.error(`[pdf2docx] Conversion error:`, error.message);
      throw error;
    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles([tempInputPath, tempOutputPath]);
    }
  }

  /**
   * Execute the Python pdf2docx script
   */
  executePythonScript(inputPath, outputPath, optionsJson) {
    return new Promise((resolve, reject) => {
      // Build Python commands list based on platform
      let pythonCommands;
      
      if (this.isWindows) {
        // Windows: Try py launcher first, then generic python
        pythonCommands = [
          { cmd: 'py', args: ['-3.13'] },
          { cmd: 'py', args: ['-3'] },
          { cmd: 'python3', args: [] },
          { cmd: 'python', args: [] },
          { cmd: 'py', args: [] }
        ];
      } else {
        // Linux/Mac: Try virtual environment first, then system python
        pythonCommands = [
          { cmd: this.linuxPythonPath, args: [] },  // Virtual environment Python
          { cmd: 'python3', args: [] },
          { cmd: 'python', args: [] }
        ];
      }
      
      let currentIndex = 0;

      const tryPython = (pythonConfig) => {
        const { cmd, args } = pythonConfig;
        const fullArgs = [...args, this.pythonScript, inputPath, outputPath, optionsJson];
        const projectRoot = path.join(__dirname, '../../..');
        console.log(`[pdf2docx] Trying Python command: ${cmd} ${args.join(' ')}`);
        
        // Set up environment variables
        const envVars = { ...process.env };
        
        if (this.isWindows) {
          // Windows: Add local site-packages to PYTHONPATH
          envVars.PYTHONPATH = path.join(projectRoot, 'Lib', 'site-packages');
        } else {
          // Linux: Use virtual environment
          envVars.VIRTUAL_ENV = this.linuxVenvPath;
          envVars.PATH = `${path.join(this.linuxVenvPath, 'bin')}:${process.env.PATH}`;
        }
        
        const pythonProcess = spawn(cmd, fullArgs, {
          timeout: 300000, // 5 minute timeout
          maxBuffer: 50 * 1024 * 1024, // 50MB buffer
          cwd: projectRoot,
          env: envVars
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('error', (error) => {
          console.log(`[pdf2docx] Python command '${cmd} ${args.join(' ')}' failed:`, error.message);
          currentIndex++;
          if (currentIndex < pythonCommands.length) {
            tryPython(pythonCommands[currentIndex]);
          } else {
            reject(new Error('Python not found. Please install Python and pdf2docx library.'));
          }
        });

        pythonProcess.on('close', (code) => {
          console.log(`[pdf2docx] Python process exited with code: ${code}`);
          
          // Filter out the "Could not find platform independent libraries" warning
          const filteredStderr = stderr.split('\n')
            .filter(line => !line.includes('Could not find platform independent libraries'))
            .join('\n').trim();
          
          if (filteredStderr) {
            console.log(`[pdf2docx] stderr: ${filteredStderr}`);
          }

          try {
            // Find JSON in stdout (may have warnings before it)
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              resolve(result);
            } else if (code === 0) {
              resolve({ success: true, output_path: outputPath });
            } else {
              resolve({ 
                success: false, 
                error: filteredStderr || stdout || `Process exited with code ${code}` 
              });
            }
          } catch (parseError) {
            if (code === 0) {
              resolve({ success: true, output_path: outputPath });
            } else {
              resolve({ 
                success: false, 
                error: filteredStderr || stdout || `Process exited with code ${code}` 
              });
            }
          }
        });
      };

      tryPython(pythonCommands[currentIndex]);
    });
  }

  /**
   * Reset the availability cache
   */
  resetCache() {
    this.isAvailable = null;
    this.pythonCommand = null;
  }

  /**
   * Check if pdf2docx is available
   * @param {boolean} forceCheck - Force a fresh check, ignoring cache
   */
  async checkAvailability(forceCheck = false) {
    // Return cached result if available and not forcing a fresh check
    if (!forceCheck && this.isAvailable !== null) {
      return { 
        available: this.isAvailable, 
        pythonCommand: this.pythonCommand,
        reason: this.isAvailable ? null : 'pdf2docx not installed'
      };
    }
    
    // Reset cache for fresh check
    this.isAvailable = null;
    this.pythonCommand = null;

    return new Promise((resolve) => {
      // Build Python commands list based on platform
      let pythonCommands;
      
      if (this.isWindows) {
        pythonCommands = [
          { cmd: 'py', args: ['-3.13', '-c', 'from pdf2docx import Converter; print("ok")'] },
          { cmd: 'py', args: ['-3', '-c', 'from pdf2docx import Converter; print("ok")'] },
          { cmd: 'python3', args: ['-c', 'from pdf2docx import Converter; print("ok")'] },
          { cmd: 'python', args: ['-c', 'from pdf2docx import Converter; print("ok")'] },
          { cmd: 'py', args: ['-c', 'from pdf2docx import Converter; print("ok")'] }
        ];
      } else {
        pythonCommands = [
          { cmd: this.linuxPythonPath, args: ['-c', 'from pdf2docx import Converter; print("ok")'] },
          { cmd: 'python3', args: ['-c', 'from pdf2docx import Converter; print("ok")'] },
          { cmd: 'python', args: ['-c', 'from pdf2docx import Converter; print("ok")'] }
        ];
      }
      
      let currentIndex = 0;

      const tryCheck = (pythonConfig) => {
        const { cmd, args } = pythonConfig;
        const projectRoot = path.join(__dirname, '../../..');
        
        // Set up environment variables
        const envVars = { ...process.env };
        
        if (this.isWindows) {
          envVars.PYTHONPATH = path.join(projectRoot, 'Lib', 'site-packages');
        } else {
          envVars.VIRTUAL_ENV = this.linuxVenvPath;
          envVars.PATH = `${path.join(this.linuxVenvPath, 'bin')}:${process.env.PATH}`;
        }
        
        const checkProcess = spawn(cmd, args, {
          cwd: projectRoot,
          env: envVars
        });
        
        let stdout = '';
        
        checkProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        checkProcess.on('error', () => {
          currentIndex++;
          if (currentIndex < pythonCommands.length) {
            tryCheck(pythonCommands[currentIndex]);
          } else {
            this.isAvailable = false;
            resolve({ available: false, reason: 'Python not found' });
          }
        });

        checkProcess.on('close', (code) => {
          if (code === 0 && stdout.includes('ok')) {
            this.isAvailable = true;
            this.pythonCommand = `${cmd} ${args.slice(0, -2).join(' ')}`.trim();
            resolve({ available: true, pythonCommand: this.pythonCommand });
          } else {
            currentIndex++;
            if (currentIndex < pythonCommands.length) {
              tryCheck(pythonCommands[currentIndex]);
            } else {
              this.isAvailable = false;
              resolve({ available: false, reason: 'pdf2docx not installed' });
            }
          }
        });
      };

      tryCheck(pythonCommands[currentIndex]);
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

module.exports = new Pdf2DocxService();
