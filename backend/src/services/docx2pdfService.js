/**
 * Word to PDF Conversion Service using Python libraries
 * Provides format preservation for Word to PDF conversion
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class Docx2PdfService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../python_services/word_to_pdf.py');
    this.tempDir = path.join(__dirname, '../../temp');
    this.isAvailable = null;
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
   * Convert Word to PDF using Python libraries
   * @param {Buffer} docxBuffer - Word document buffer
   * @param {string} filename - Original filename
   * @param {Object} options - Conversion options
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async convertWordToPdf(docxBuffer, filename, options = {}) {
    const tempId = uuidv4();
    const tempInputPath = path.join(this.tempDir, `${tempId}_input.docx`);
    const tempOutputPath = path.join(this.tempDir, `${tempId}_output.pdf`);

    try {
      console.log(`[docx2pdf] Starting conversion for: ${filename}`);
      
      // Write DOCX buffer to temp file
      await fs.writeFile(tempInputPath, docxBuffer);
      console.log(`[docx2pdf] Temp input file created: ${tempInputPath}`);

      // Prepare options JSON
      const optionsJson = JSON.stringify({
        page_size: options.pageSize || 'A4',
        preserve_formatting: options.preserveFormatting !== false,
        preserve_images: options.preserveImages !== false,
        preserve_tables: options.preserveTables !== false
      });

      // Execute Python script
      const result = await this.executePythonScript(tempInputPath, tempOutputPath, optionsJson);

      if (!result.success) {
        throw new Error(result.error || 'Word to PDF conversion failed');
      }

      // Read output file
      const outputBuffer = await fs.readFile(tempOutputPath);
      console.log(`[docx2pdf] Conversion successful. Output size: ${outputBuffer.length} bytes`);

      return outputBuffer;

    } catch (error) {
      console.error(`[docx2pdf] Conversion error:`, error.message);
      throw error;
    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles([tempInputPath, tempOutputPath]);
    }
  }

  /**
   * Execute the Python word_to_pdf script
   */
  executePythonScript(inputPath, outputPath, optionsJson) {
    return new Promise((resolve, reject) => {
      let pythonCommands;
      
      if (this.isWindows) {
        pythonCommands = [
          { cmd: 'py', args: ['-3.13'] },
          { cmd: 'py', args: ['-3'] },
          { cmd: 'python3', args: [] },
          { cmd: 'python', args: [] },
          { cmd: 'py', args: [] }
        ];
      } else {
        pythonCommands = [
          { cmd: this.linuxPythonPath, args: [] },
          { cmd: 'python3', args: [] },
          { cmd: 'python', args: [] }
        ];
      }
      
      let currentIndex = 0;

      const tryPython = (pythonConfig) => {
        const { cmd, args } = pythonConfig;
        const fullArgs = [...args, this.pythonScript, inputPath, outputPath, optionsJson];
        const projectRoot = path.join(__dirname, '../../..');
        console.log(`[docx2pdf] Trying Python command: ${cmd} ${args.join(' ')}`);
        
        const envVars = { ...process.env };
        
        if (this.isWindows) {
          envVars.PYTHONPATH = path.join(projectRoot, 'Lib', 'site-packages');
        } else {
          envVars.VIRTUAL_ENV = this.linuxVenvPath;
          envVars.PATH = `${path.join(this.linuxVenvPath, 'bin')}:${process.env.PATH}`;
        }
        
        const pythonProcess = spawn(cmd, fullArgs, {
          timeout: 300000,
          maxBuffer: 50 * 1024 * 1024,
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
          console.log(`[docx2pdf] Python command '${cmd} ${args.join(' ')}' failed:`, error.message);
          currentIndex++;
          if (currentIndex < pythonCommands.length) {
            tryPython(pythonCommands[currentIndex]);
          } else {
            reject(new Error('Python not found. Please install Python and required libraries.'));
          }
        });

        pythonProcess.on('close', (code) => {
          console.log(`[docx2pdf] Python process exited with code: ${code}`);
          
          const filteredStderr = stderr.split('\n')
            .filter(line => !line.includes('Could not find platform independent libraries'))
            .join('\n').trim();
          
          if (filteredStderr) {
            console.log(`[docx2pdf] stderr: ${filteredStderr}`);
          }

          try {
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
   * Check if the service is available
   */
  async checkAvailability(forceCheck = false) {
    if (!forceCheck && this.isAvailable !== null) {
      return { 
        available: this.isAvailable, 
        pythonCommand: this.pythonCommand,
        reason: this.isAvailable ? null : 'Required libraries not installed'
      };
    }
    
    this.isAvailable = null;
    this.pythonCommand = null;

    return new Promise((resolve) => {
      let pythonCommands;
      
      if (this.isWindows) {
        pythonCommands = [
          { cmd: 'py', args: ['-3.13', '-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] },
          { cmd: 'py', args: ['-3', '-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] },
          { cmd: 'python3', args: ['-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] },
          { cmd: 'python', args: ['-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] }
        ];
      } else {
        pythonCommands = [
          { cmd: this.linuxPythonPath, args: ['-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] },
          { cmd: 'python3', args: ['-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] },
          { cmd: 'python', args: ['-c', 'from docx import Document; from reportlab.platypus import SimpleDocTemplate; print("ok")'] }
        ];
      }
      
      let currentIndex = 0;

      const tryCheck = (pythonConfig) => {
        const { cmd, args } = pythonConfig;
        const projectRoot = path.join(__dirname, '../../..');
        
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
            this.pythonCommand = cmd;
            resolve({ available: true, pythonCommand: this.pythonCommand });
          } else {
            currentIndex++;
            if (currentIndex < pythonCommands.length) {
              tryCheck(pythonCommands[currentIndex]);
            } else {
              this.isAvailable = false;
              resolve({ available: false, reason: 'Required libraries not installed' });
            }
          }
        });
      };

      tryCheck(pythonCommands[currentIndex]);
    });
  }

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

module.exports = new Docx2PdfService();
