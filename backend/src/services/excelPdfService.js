/**
 * Excel PDF Conversion Service
 * Uses Python for better Excel to PDF and PDF to Excel conversion
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ExcelPdfService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../python_services/excel_pdf_converter.py');
    this.tempDir = path.join(__dirname, '../../temp');
    this.pythonCommand = null;
    this.available = null; // Will be checked on first use
    this.lastCheck = null;
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async checkAvailability(forceCheck = false) {
    // Re-check every 5 minutes or if forced
    const now = Date.now();
    const cacheExpired = this.lastCheck && (now - this.lastCheck > 5 * 60 * 1000);
    
    if (this.available !== null && !forceCheck && !cacheExpired) {
      return { available: this.available, pythonCommand: this.pythonCommand };
    }
    
    this.lastCheck = now;

    // On Windows, 'py' is the most reliable command
    const isWindows = process.platform === 'win32';
    const pythonCommands = isWindows 
      ? ['py', 'python', 'python3'] 
      : ['python3', 'python', 'py'];
    
    for (const cmd of pythonCommands) {
      try {
        console.log(`[ExcelPdfService] Checking Python command: ${cmd}`);
        const result = await this.runCommand(cmd, ['--version']);
        console.log(`[ExcelPdfService] ${cmd} --version result:`, result);
        
        if (result.success) {
          // Check if required packages are available using a temp script file
          const checkResult = await this.checkPythonPackages(cmd);
          console.log(`[ExcelPdfService] Package check result:`, checkResult);
          
          if (checkResult.success && checkResult.output.includes('OK')) {
            this.pythonCommand = cmd;
            this.available = true;
            console.log(`[ExcelPdfService] Python available: ${cmd}`);
            return { available: true, pythonCommand: cmd };
          } else {
            console.log(`[ExcelPdfService] ${cmd} missing packages:`, checkResult.error || checkResult.output);
          }
        }
      } catch (error) {
        console.log(`[ExcelPdfService] Error checking ${cmd}:`, error.message);
        continue;
      }
    }

    this.available = false;
    console.log('[ExcelPdfService] Python not available or missing dependencies');
    return { available: false, reason: 'Python or required packages not available' };
  }

  async checkPythonPackages(pythonCmd) {
    // Write a temp script to check packages (avoids shell escaping issues)
    await this.ensureTempDir();
    const checkScriptPath = path.join(this.tempDir, `check_packages_${Date.now()}.py`);
    // Use explicit line endings and no leading whitespace
    const checkScript = [
      'import sys',
      'try:',
      '    import openpyxl',
      '    import reportlab',
      '    import pdfplumber',
      '    print("OK")',
      'except ImportError as e:',
      '    print("MISSING: " + str(e))',
      '    sys.exit(1)',
      ''
    ].join('\n');
    
    try {
      await fs.writeFile(checkScriptPath, checkScript, { encoding: 'utf8' });
      // Use the script path directly without shell interpretation issues
      const result = await this.runCommandDirect(pythonCmd, [checkScriptPath]);
      await fs.unlink(checkScriptPath).catch(() => {});
      return result;
    } catch (error) {
      await fs.unlink(checkScriptPath).catch(() => {});
      return { success: false, output: '', error: error.message };
    }
  }

  // Run command without shell to avoid path escaping issues on Windows
  runCommandDirect(command, args) {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        timeout: 10000,
        shell: false,  // Don't use shell to avoid escaping issues
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout.trim(),
          error: stderr.trim()
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message
        });
      });
    });
  }

  runCommand(command, args) {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        timeout: 10000,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout.trim(),
          error: stderr.trim()
        });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message
        });
      });
    });
  }

  async convertExcelToPdf(buffer, filename, options = {}) {
    const status = await this.checkAvailability();
    
    if (!status.available) {
      throw new Error('Python Excel converter not available. Using fallback conversion.');
    }

    const inputPath = path.join(this.tempDir, `${uuidv4()}_${filename}`);
    const outputPath = path.join(this.tempDir, `${uuidv4()}.pdf`);

    try {
      // Write input file
      await fs.writeFile(inputPath, buffer);

      // Run Python converter
      const result = await this.runPythonConverter('excel-to-pdf', inputPath, outputPath, options);

      if (!result.success) {
        throw new Error(result.error || 'Excel to PDF conversion failed');
      }

      // Read output file
      const pdfBuffer = await fs.readFile(outputPath);

      // Cleanup
      await this.cleanup(inputPath, outputPath);

      return pdfBuffer;
    } catch (error) {
      await this.cleanup(inputPath, outputPath);
      throw error;
    }
  }

  async convertPdfToExcel(buffer, filename, options = {}) {
    const status = await this.checkAvailability();
    
    if (!status.available) {
      throw new Error('Python Excel converter not available. Using fallback conversion.');
    }

    const inputPath = path.join(this.tempDir, `${uuidv4()}.pdf`);
    const outputPath = path.join(this.tempDir, `${uuidv4()}.xlsx`);

    try {
      // Write input file
      await fs.writeFile(inputPath, buffer);

      // Run Python converter
      const result = await this.runPythonConverter('pdf-to-excel', inputPath, outputPath, options);

      if (!result.success) {
        throw new Error(result.error || 'PDF to Excel conversion failed');
      }

      // Read output file
      const excelBuffer = await fs.readFile(outputPath);

      // Cleanup
      await this.cleanup(inputPath, outputPath);

      return excelBuffer;
    } catch (error) {
      await this.cleanup(inputPath, outputPath);
      throw error;
    }
  }

  runPythonConverter(mode, inputPath, outputPath, options) {
    return new Promise((resolve) => {
      const args = [
        this.pythonScript,
        mode,
        inputPath,
        outputPath,
        JSON.stringify(options)
      ];

      console.log(`[ExcelPdfService] Running: ${this.pythonCommand} ${args.join(' ')}`);

      const proc = spawn(this.pythonCommand, args, {
        timeout: 120000, // 2 minutes
        shell: false,  // Don't use shell for better path handling
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        console.log(`[ExcelPdfService] Python converter finished with code ${code}`);
        if (stderr) {
          console.log(`[ExcelPdfService] stderr: ${stderr}`);
        }
        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (e) {
          resolve({
            success: code === 0,
            error: stderr || stdout || 'Unknown error'
          });
        }
      });

      proc.on('error', (error) => {
        console.log(`[ExcelPdfService] Process error: ${error.message}`);
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  async cleanup(...paths) {
    for (const filePath of paths) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = new ExcelPdfService();
