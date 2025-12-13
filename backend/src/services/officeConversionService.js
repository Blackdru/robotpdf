const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLib } = require('pdf-lib');
const mammoth = require('mammoth');
const { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell } = require('docx');
const ExcelJS = require('exceljs');
const PptxGenJS = require('pptxgenjs');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class OfficeConversionService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  // Office to PDF - Convert Word, Excel, PowerPoint to PDF
  async convertOfficeToPdf(buffer, fileType, filename) {
    console.log(`Converting ${fileType} to PDF...`);

    try {
      if (fileType.includes('word') || filename.match(/\.(docx?|rtf|odt)$/i)) {
        return await this.wordToPdf(buffer, filename);
      } else if (fileType.includes('spreadsheet') || filename.match(/\.(xlsx?|csv)$/i)) {
        return await this.excelToPdf(buffer, filename);
      } else if (fileType.includes('presentation') || filename.match(/\.(pptx?|odp)$/i)) {
        return await this.powerPointToPdf(buffer, filename);
      } else if (fileType.includes('text/plain') || filename.endsWith('.txt')) {
        return await this.textToPdf(buffer, filename);
      } else {
        throw new Error('Unsupported file format for conversion');
      }
    } catch (error) {
      console.error('Office to PDF conversion error:', error);
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  // Word to PDF conversion
  async wordToPdf(buffer, filename, options = {}) {
    console.log('Converting Word document to PDF...');

    try {
      // Try Python-based conversion first for better format preservation
      try {
        const docx2pdfService = require('./docx2pdfService');
        console.log('[officeConversion] Attempting Python-based Word to PDF conversion...');
        const pdfBuffer = await docx2pdfService.convertWordToPdf(buffer, filename, options);
        console.log('[officeConversion] Python-based Word to PDF conversion successful!');
        return pdfBuffer;
      } catch (pythonError) {
        console.warn('[officeConversion] Python Word to PDF failed, falling back to basic conversion:', pythonError.message);
      }

      // Fallback: Extract text and formatting from Word document using mammoth
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value;
      const messages = result.messages;

      if (messages.length > 0) {
        console.log('Conversion warnings:', messages);
      }

      // Create PDF from HTML content
      return await this.htmlToPdfBuffer(html, filename);
    } catch (error) {
      console.error('Word to PDF error:', error);
      throw new Error(`Word conversion failed: ${error.message}`);
    }
  }

  // Excel to PDF conversion with improved formatting
  async excelToPdf(buffer, filename) {
    console.log('Converting Excel spreadsheet to PDF...');

    // Try Python-based conversion first for better formatting
    try {
      const excelPdfService = require('./excelPdfService');
      const status = await excelPdfService.checkAvailability();
      if (status.available) {
        console.log('[officeConversion] Using Python-based Excel to PDF conversion...');
        const pdfBuffer = await excelPdfService.convertExcelToPdf(buffer, filename, {});
        console.log('[officeConversion] Python Excel to PDF conversion successful!');
        return pdfBuffer;
      }
    } catch (pythonError) {
      console.warn('[officeConversion] Python Excel to PDF failed, using fallback:', pythonError.message);
    }

    try {
      // Fallback: Read Excel file using ExcelJS
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      // Create PDF with landscape orientation for better table display
      const pdfDoc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
      });

      const pageWidth = pdfDoc.page.width - 80; // Account for margins
      const pageHeight = pdfDoc.page.height - 80;

      // Process each sheet
      let isFirstSheet = true;
      workbook.eachSheet((worksheet, sheetIndex) => {
        if (!isFirstSheet) {
          pdfDoc.addPage();
        }
        isFirstSheet = false;

        // Add sheet name as header
        pdfDoc.fontSize(14).fillColor('#1a365d').text(`Sheet: ${worksheet.name}`, { underline: true });
        pdfDoc.moveDown(0.5);

        if (worksheet.rowCount === 0) {
          pdfDoc.fontSize(10).fillColor('#666666').text('(Empty sheet)', { italics: true });
          return;
        }

        // Calculate optimal column widths based on content
        const columnWidths = [];
        const maxCols = Math.min(worksheet.columnCount || 10, 20); // Limit columns
        
        // First pass: calculate content-based widths
        for (let col = 1; col <= maxCols; col++) {
          let maxWidth = 50; // Minimum width
          worksheet.eachRow((row, rowIndex) => {
            if (rowIndex > 100) return; // Sample first 100 rows
            const cell = row.getCell(col);
            const cellValue = this.getCellDisplayValue(cell);
            const textWidth = Math.min(cellValue.length * 6 + 10, 200); // Estimate width
            maxWidth = Math.max(maxWidth, textWidth);
          });
          columnWidths.push(maxWidth);
        }

        // Normalize widths to fit page
        const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
        const scaleFactor = totalWidth > pageWidth ? pageWidth / totalWidth : 1;
        const scaledWidths = columnWidths.map(w => Math.max(w * scaleFactor, 30));

        // Draw table
        let y = pdfDoc.y + 10;
        const startX = 40;
        const rowHeight = 22;
        let rowCount = 0;

        worksheet.eachRow((row, rowIndex) => {
          // Check if we need a new page
          if (y + rowHeight > pageHeight + 40) {
            pdfDoc.addPage();
            y = 40;
            
            // Redraw header row on new page if this isn't the first row
            if (rowIndex > 1) {
              const headerRow = worksheet.getRow(1);
              this.drawExcelRow(pdfDoc, headerRow, startX, y, scaledWidths, rowHeight, true, maxCols);
              y += rowHeight;
            }
          }

          // Draw row (first row is header)
          const isHeader = rowIndex === 1;
          this.drawExcelRow(pdfDoc, row, startX, y, scaledWidths, rowHeight, isHeader, maxCols);
          y += rowHeight;
          rowCount++;

          // Limit rows per sheet to prevent huge PDFs
          if (rowCount > 500) {
            pdfDoc.fontSize(10).fillColor('#666666').text('... (additional rows truncated)', startX, y + 10);
            return false; // Stop iteration
          }
        });

        pdfDoc.moveDown(2);
      });

      pdfDoc.end();
      return await pdfPromise;
    } catch (error) {
      console.error('Excel to PDF error:', error);
      throw new Error(`Excel conversion failed: ${error.message}`);
    }
  }

  // Helper to draw a single Excel row with proper formatting
  drawExcelRow(pdfDoc, row, startX, y, columnWidths, rowHeight, isHeader, maxCols) {
    let x = startX;
    
    for (let colIndex = 1; colIndex <= maxCols; colIndex++) {
      const cell = row.getCell(colIndex);
      const cellValue = this.getCellDisplayValue(cell);
      const colWidth = columnWidths[colIndex - 1] || 50;

      // Get cell styling
      const fill = cell.fill;
      const font = cell.font || {};
      const alignment = cell.alignment || {};
      const border = cell.border || {};

      // Determine background color
      let bgColor = '#ffffff';
      if (isHeader) {
        bgColor = '#e2e8f0';
      } else if (fill) {
        if (fill.type === 'pattern' && fill.pattern === 'solid') {
          if (fill.fgColor) {
            if (fill.fgColor.argb) {
              bgColor = this.argbToHex(fill.fgColor.argb);
            } else if (fill.fgColor.theme !== undefined) {
              // Theme colors - use defaults
              const themeColors = ['#ffffff', '#000000', '#e7e6e6', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47'];
              bgColor = themeColors[fill.fgColor.theme] || '#ffffff';
            }
          }
        }
      }

      // Draw cell background
      pdfDoc.rect(x, y, colWidth, rowHeight).fill(bgColor);

      // Draw cell borders
      const borderColor = '#cbd5e1';
      pdfDoc.rect(x, y, colWidth, rowHeight).stroke(borderColor);

      // Determine text color
      let textColor = '#1a202c';
      if (font.color) {
        if (font.color.argb) {
          textColor = this.argbToHex(font.color.argb);
        } else if (font.color.theme !== undefined) {
          const themeColors = ['#ffffff', '#000000', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47'];
          textColor = themeColors[font.color.theme] || '#1a202c';
        }
      }

      // Determine font style
      const fontSize = isHeader ? 9 : 8;
      let fontStyle = 'Helvetica';
      if (isHeader || font.bold) {
        fontStyle = font.italic ? 'Helvetica-BoldOblique' : 'Helvetica-Bold';
      } else if (font.italic) {
        fontStyle = 'Helvetica-Oblique';
      }
      
      pdfDoc
        .font(fontStyle)
        .fontSize(fontSize)
        .fillColor(textColor);

      // Determine text alignment
      let textAlign = 'left';
      if (alignment.horizontal === 'center') {
        textAlign = 'center';
      } else if (alignment.horizontal === 'right') {
        textAlign = 'right';
      } else if (typeof cell.value === 'number' || (cell.value && cell.value.result !== undefined && typeof cell.value.result === 'number')) {
        // Numbers default to right alignment
        textAlign = 'right';
      }

      // Calculate text position
      const padding = 3;
      const textX = x + padding;
      const textY = y + (rowHeight - fontSize) / 2;
      const textWidth = colWidth - (padding * 2);

      // Draw the text
      if (cellValue) {
        pdfDoc.text(cellValue, textX, textY, {
          width: textWidth,
          height: rowHeight - 4,
          ellipsis: true,
          align: textAlign,
          lineBreak: false
        });
      }

      x += colWidth;
    }
  }

  // Helper to get display value from Excel cell - FIXED for formulas
  getCellDisplayValue(cell) {
    if (cell.value === null || cell.value === undefined) return '';
    
    const value = cell.value;
    
    // Handle formula cells - get the calculated result, not the formula
    if (typeof value === 'object') {
      // Formula cell: { formula: '=A1+B1', result: 123 }
      if (value.formula !== undefined) {
        // Return the calculated result, not the formula
        if (value.result !== undefined && value.result !== null) {
          return this.formatCellValue(value.result, cell.numFmt);
        }
        // If no result, try to return empty or the sharedFormula result
        if (value.sharedFormula !== undefined && value.result !== undefined) {
          return this.formatCellValue(value.result, cell.numFmt);
        }
        return ''; // Formula without result
      }
      
      // Rich text: { richText: [{text: 'Hello', font: {...}}] }
      if (value.richText && Array.isArray(value.richText)) {
        return value.richText.map(rt => rt.text || '').join('');
      }
      
      // Hyperlink: { text: 'Click here', hyperlink: 'http://...' }
      if (value.text !== undefined) {
        return String(value.text);
      }
      
      // Error value: { error: '#DIV/0!' }
      if (value.error !== undefined) {
        return String(value.error);
      }
      
      // Date object
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      // Unknown object - try to get a sensible string
      return '';
    }
    
    // Handle numbers with formatting
    if (typeof value === 'number') {
      return this.formatCellValue(value, cell.numFmt);
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    // Handle strings
    return String(value);
  }

  // Format numeric values based on Excel number format
  formatCellValue(value, numFmt) {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'number') {
      if (numFmt) {
        // Percentage format
        if (numFmt.includes('%')) {
          return (value * 100).toFixed(2) + '%';
        }
        // Currency formats
        if (numFmt.includes('$') || numFmt.includes('£') || numFmt.includes('€') || numFmt.includes('₹')) {
          const symbol = numFmt.match(/[$£€₹]/)?.[0] || '$';
          return symbol + Math.abs(value).toFixed(2);
        }
        // Accounting format with parentheses for negative
        if (numFmt.includes('(') && value < 0) {
          return '(' + Math.abs(value).toFixed(2) + ')';
        }
        // Decimal places
        const decimalMatch = numFmt.match(/\.([0#]+)/);
        if (decimalMatch) {
          const decimals = decimalMatch[1].length;
          return value.toFixed(decimals);
        }
        // Thousands separator
        if (numFmt.includes(',')) {
          return value.toLocaleString();
        }
      }
      // Default: show reasonable precision
      if (Number.isInteger(value)) {
        return String(value);
      }
      return value.toFixed(2);
    }
    
    return String(value);
  }

  // Helper to convert ARGB to hex color
  argbToHex(argb) {
    if (!argb || argb.length < 6) return '#ffffff';
    // ARGB format: AARRGGBB, we need #RRGGBB
    const hex = argb.length === 8 ? argb.substring(2) : argb;
    return '#' + hex.toLowerCase();
  }

  // PowerPoint to PDF conversion
  async powerPointToPdf(buffer, filename) {
    console.log('Converting PowerPoint presentation to PDF...');

    try {
      // For PPTX, we'll create a simple PDF with slide information
      // Note: Full PPTX parsing requires complex libraries
      
      const pdfDoc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50
      });

      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
      });

      // Add title page
      pdfDoc.fontSize(20).text(`PowerPoint Presentation`, { align: 'center' });
      pdfDoc.moveDown();
      pdfDoc.fontSize(14).text(filename, { align: 'center' });
      pdfDoc.moveDown(2);
      pdfDoc.fontSize(12).text('Converted to PDF', { align: 'center' });
      pdfDoc.moveDown();
      pdfDoc.fontSize(10).text(`Conversion Date: ${new Date().toLocaleString()}`, { align: 'center' });

      // Add note about conversion
      pdfDoc.addPage();
      pdfDoc.fontSize(12).text('Note:', { underline: true });
      pdfDoc.moveDown();
      pdfDoc.fontSize(10).text(
        'This is a simplified conversion of your PowerPoint presentation. ' +
        'For full fidelity conversion with all formatting, images, and animations, ' +
        'please use Microsoft PowerPoint or LibreOffice to export to PDF.',
        { align: 'justify' }
      );

      pdfDoc.end();
      return await pdfPromise;
    } catch (error) {
      console.error('PowerPoint to PDF error:', error);
      throw new Error(`PowerPoint conversion failed: ${error.message}`);
    }
  }

  // Text to PDF conversion
  async textToPdf(buffer, filename) {
    console.log('Converting text file to PDF...');

    try {
      const text = buffer.toString('utf-8');
      
      const pdfDoc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
      });

      // Add title
      pdfDoc.fontSize(14).text(filename, { align: 'center' });
      pdfDoc.moveDown(2);

      // Add text content
      pdfDoc.fontSize(11).text(text, {
        align: 'left',
        lineGap: 2
      });

      pdfDoc.end();
      return await pdfPromise;
    } catch (error) {
      console.error('Text to PDF error:', error);
      throw new Error(`Text conversion failed: ${error.message}`);
    }
  }

  // HTML to PDF buffer
  async htmlToPdfBuffer(html, filename) {
    // Simple HTML to PDF conversion
    // Strip HTML tags and convert to plain text for basic conversion
    const text = html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    const pdfDoc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
    });

    // Add title
    pdfDoc.fontSize(14).text(filename.replace(/\.[^.]+$/, ''), { align: 'center' });
    pdfDoc.moveDown(2);

    // Add content
    pdfDoc.fontSize(11).text(text, {
      align: 'left',
      lineGap: 2
    });

    pdfDoc.end();
    return await pdfPromise;
  }

  // PDF to Office - Convert PDF to Word, Excel, PowerPoint
  async convertPdfToOffice(buffer, outputFormat, filename, options = {}) {
    console.log(`Converting PDF to ${outputFormat}...`);
    console.log('[officeConversion] Options received:', JSON.stringify(options));

    try {
      // For Word conversion, try pdf2docx first for exact format preservation
      if (outputFormat === 'docx' || outputFormat === 'doc') {
        try {
          const pdf2docxService = require('./pdf2docxService');
          console.log('[officeConversion] Attempting pdf2docx conversion for exact format preservation...');
          const wordBuffer = await pdf2docxService.convertPdfToWord(buffer, filename, options);
          console.log('[officeConversion] pdf2docx conversion successful!');
          return wordBuffer;
        } catch (pdf2docxError) {
          console.warn('[officeConversion] pdf2docx failed, falling back to basic conversion:', pdf2docxError.message);
          // Fall through to basic conversion
        }
      }

      // For Excel conversion, try Python-based conversion first for better table detection
      if (outputFormat === 'xlsx' || outputFormat === 'xls') {
        try {
          const excelPdfService = require('./excelPdfService');
          const status = await excelPdfService.checkAvailability();
          if (status.available) {
            console.log('[officeConversion] Attempting Python-based PDF to Excel conversion...');
            const excelBuffer = await excelPdfService.convertPdfToExcel(buffer, filename, options);
            console.log('[officeConversion] Python PDF to Excel conversion successful!');
            return excelBuffer;
          }
        } catch (pythonError) {
          console.warn('[officeConversion] Python PDF to Excel failed, falling back to basic conversion:', pythonError.message);
          // Fall through to basic conversion
        }
      }

      let text = '';
      let pageCount = 1;

      // Try to parse PDF to extract text
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
        pageCount = pdfData.numpages;
        console.log(`Extracted ${text.length} characters from ${pageCount} pages`);
      } catch (parseError) {
        console.warn('pdf-parse failed, trying alternative extraction:', parseError.message);
        // Alternative: Try extracting text using pdf-lib
        try {
          const pdfDoc = await PDFLib.load(buffer);
          pageCount = pdfDoc.getPageCount();
          const pages = pdfDoc.getPages();
          
          // Try to extract text from PDF metadata and structure
          const title = pdfDoc.getTitle() || 'Untitled Document';
          const author = pdfDoc.getAuthor() || '';
          const subject = pdfDoc.getSubject() || '';
          
          text = `${title}\n\n`;
          if (author) text += `Author: ${author}\n`;
          if (subject) text += `Subject: ${subject}\n\n`;
          
          // Add page information
          for (let i = 0; i < pageCount; i++) {
            const page = pages[i];
            const { width, height } = page.getSize();
            text += `Page ${i + 1} (${Math.round(width)}x${Math.round(height)} pts)\n\n`;
          }
          
          text += `\nThis PDF contains ${pageCount} page(s). The document structure has been preserved in the conversion.\n\nNote: For PDFs with complex formatting or scanned content, text extraction may be limited. The converted document maintains the page structure.`;
          
          console.log(`Extracted metadata and structure for ${pageCount} pages`);
        } catch (fallbackError) {
          console.error('Alternative extraction failed:', fallbackError.message);
          text = 'PDF Document\n\nContent could not be fully extracted. The document structure has been preserved.';
          pageCount = 1;
        }
      }

      if (outputFormat === 'docx' || outputFormat === 'doc') {
        return await this.pdfToWord(text, pageCount, filename);
      } else if (outputFormat === 'xlsx' || outputFormat === 'xls') {
        return await this.pdfToExcel(text, pageCount, filename);
      } else if (outputFormat === 'pptx') {
        return await this.pdfToPowerPoint(text, pageCount, filename);
      } else if (outputFormat === 'txt') {
        return Buffer.from(text, 'utf-8');
      } else if (outputFormat === 'rtf') {
        return await this.pdfToRtf(text, filename);
      } else {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }
    } catch (error) {
      console.error('PDF to Office conversion error:', error);
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  // PDF to Word conversion
  async pdfToWord(text, pageCount, filename) {
    console.log('Converting PDF to Word document...');

    try {
      // Split text into paragraphs
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `Converted from: ${filename}`,
              heading: 'Heading1'
            }),
            new Paragraph({
              text: `Pages: ${pageCount}`,
              spacing: { after: 200 }
            }),
            ...paragraphs.map(para => 
              new Paragraph({
                children: [new TextRun(para.trim())]
              })
            )
          ]
        }]
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      console.error('PDF to Word error:', error);
      throw new Error(`PDF to Word conversion failed: ${error.message}`);
    }
  }

  // PDF to Excel conversion - extracts ALL content (text AND tables)
  async pdfToExcel(text, pageCount, filename) {
    console.log('Converting PDF to Excel spreadsheet (extracting all content)...');

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'RobotPDF Converter';
      workbook.created = new Date();

      // Create worksheet for all content
      const worksheet = workbook.addWorksheet('Converted Content');
      
      // Add metadata header
      worksheet.addRow([`Converted from: ${filename}`]);
      worksheet.addRow([`Pages: ${pageCount}`]);
      worksheet.addRow([`Conversion Date: ${new Date().toLocaleString()}`]);
      worksheet.addRow([]);

      // Style the metadata rows
      for (let i = 1; i <= 3; i++) {
        worksheet.getRow(i).font = { italic: true, color: { argb: 'FF666666' } };
      }

      // Split text into lines
      const lines = text.split('\n');
      
      // Process ALL lines - both regular text and potential table data
      let currentRow = 5;
      let inTableSection = false;
      let tableStartRow = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          // Empty line - add spacing
          currentRow++;
          inTableSection = false;
          continue;
        }

        // Check if this line looks like table data (has delimiters)
        const isTableLine = this.isLikelyTableRow(trimmedLine);
        
        if (isTableLine) {
          // Parse as table row
          const cells = this.parseTableRow(trimmedLine);
          const excelRow = worksheet.addRow(cells);
          
          // Style first row of a table section as header
          if (!inTableSection) {
            inTableSection = true;
            tableStartRow = currentRow;
            if (this.looksLikeHeader(cells)) {
              excelRow.font = { bold: true };
              excelRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE2E8F0' }
              };
            }
          }
          
          // Add borders to table cells
          excelRow.eachCell({ includeEmpty: false }, (cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
          });
        } else {
          // Regular text line - add as single cell
          inTableSection = false;
          worksheet.addRow([trimmedLine]);
        }
        
        currentRow++;
      }

      // Auto-fit columns
      this.autoFitColumns(worksheet);

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('PDF to Excel error:', error);
      throw new Error(`PDF to Excel conversion failed: ${error.message}`);
    }
  }

  // Check if a line looks like a table row
  isLikelyTableRow(line) {
    if (!line) return false;
    
    // Check for common table delimiters
    const hasTab = line.includes('\t');
    const hasPipe = line.includes('|');
    const hasMultipleSpaces = /\s{3,}/.test(line);
    const hasCommas = (line.match(/,/g) || []).length >= 2;
    
    // Count potential columns
    let columnCount = 1;
    if (hasTab) columnCount = line.split('\t').length;
    else if (hasPipe) columnCount = line.split('|').filter(s => s.trim()).length;
    else if (hasMultipleSpaces) columnCount = line.split(/\s{3,}/).filter(s => s.trim()).length;
    else if (hasCommas) columnCount = line.split(',').length;
    
    return columnCount >= 2;
  }

  // Parse a table row into cells
  parseTableRow(line) {
    if (!line) return [''];
    
    // Try different delimiters in order of preference
    if (line.includes('\t')) {
      return line.split('\t').map(cell => cell.trim());
    }
    if (line.includes('|')) {
      return line.split('|').map(cell => cell.trim()).filter(cell => cell);
    }
    if (/\s{3,}/.test(line)) {
      return line.split(/\s{3,}/).map(cell => cell.trim()).filter(cell => cell);
    }
    if ((line.match(/,/g) || []).length >= 2) {
      // CSV-style parsing (handle quoted values)
      return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(cell => cell.trim().replace(/^"|"$/g, ''));
    }
    
    return [line.trim()];
  }

  // Legacy method for backward compatibility - kept for reference
  async pdfToExcelLegacy(text, pageCount, filename) {
    console.log('Converting PDF to Excel spreadsheet (legacy)...');

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'RobotPDF Converter';
      workbook.created = new Date();

      // Split text into lines
      const lines = text.split('\n').filter(line => line.trim().length > 0);

      // Analyze the content to detect table structures
      const tableData = this.detectTableStructure(lines);

      if (tableData.isTable && tableData.rows.length > 0) {
        // Create worksheet with detected table data
        const worksheet = workbook.addWorksheet('Table Data');
        
        // Add metadata header
        worksheet.addRow([`Converted from: ${filename}`]);
        worksheet.addRow([`Pages: ${pageCount}`]);
        worksheet.addRow([`Conversion Date: ${new Date().toLocaleString()}`]);
        worksheet.addRow([]);

        // Style the metadata rows
        for (let i = 1; i <= 3; i++) {
          worksheet.getRow(i).font = { italic: true, color: { argb: 'FF666666' } };
        }

        // Add table data
        let headerAdded = false;
        tableData.rows.forEach((row, index) => {
          const excelRow = worksheet.addRow(row);
          
          // Style first data row as header if it looks like a header
          if (!headerAdded && this.looksLikeHeader(row)) {
            excelRow.font = { bold: true };
            excelRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE2E8F0' }
            };
            headerAdded = true;
          }
        });

        // Auto-fit columns with better width calculation
        this.autoFitColumns(worksheet);

        // Add borders to data cells
        const dataStartRow = 5;
        for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
          const row = worksheet.getRow(rowNum);
          row.eachCell({ includeEmpty: false }, (cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
          });
        }
      } else {
        // Fallback: Create worksheet with text content
        const worksheet = workbook.addWorksheet('Converted Content');

        // Add header
        worksheet.addRow([`Converted from: ${filename}`]);
        worksheet.addRow([`Pages: ${pageCount}`]);
        worksheet.addRow([`Conversion Date: ${new Date().toLocaleString()}`]);
        worksheet.addRow([]);

        // Style the metadata rows
        for (let i = 1; i <= 3; i++) {
          worksheet.getRow(i).font = { italic: true, color: { argb: 'FF666666' } };
        }

        // Process lines with improved table detection
        lines.forEach(line => {
          // Check if line contains multiple spaces or tabs (potential table row)
          if (line.includes('\t')) {
            const cells = line.split('\t').map(cell => cell.trim());
            worksheet.addRow(cells);
          } else if (/\s{3,}/.test(line)) {
            // Multiple spaces (3+) indicate columns
            const cells = line.split(/\s{3,}/).map(cell => cell.trim()).filter(c => c);
            if (cells.length > 1) {
              worksheet.addRow(cells);
            } else {
              worksheet.addRow([line.trim()]);
            }
          } else {
            worksheet.addRow([line.trim()]);
          }
        });

        // Auto-fit columns
        this.autoFitColumns(worksheet);
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('PDF to Excel error:', error);
      throw new Error(`PDF to Excel conversion failed: ${error.message}`);
    }
  }

  // Detect table structure in text lines
  detectTableStructure(lines) {
    const result = { isTable: false, rows: [], columnCount: 0 };
    
    if (lines.length < 2) return result;

    // Analyze delimiter patterns
    let tabDelimited = 0;
    let spaceDelimited = 0;
    let pipeDelimited = 0;
    let commaDelimited = 0;

    const sampleLines = lines.slice(0, Math.min(50, lines.length));
    
    sampleLines.forEach(line => {
      if (line.includes('\t')) tabDelimited++;
      if (/\s{3,}/.test(line)) spaceDelimited++;
      if (line.includes('|')) pipeDelimited++;
      if (line.includes(',') && !line.includes(', ')) commaDelimited++;
    });

    // Determine the most likely delimiter
    let delimiter = null;
    let delimiterRegex = null;
    const threshold = sampleLines.length * 0.3; // 30% of lines should have the pattern

    if (tabDelimited > threshold) {
      delimiter = '\t';
      delimiterRegex = /\t/;
    } else if (pipeDelimited > threshold) {
      delimiter = '|';
      delimiterRegex = /\s*\|\s*/;
    } else if (spaceDelimited > threshold) {
      delimiterRegex = /\s{3,}/;
    } else if (commaDelimited > threshold) {
      delimiter = ',';
      delimiterRegex = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/; // CSV-aware split
    }

    if (!delimiterRegex) return result;

    // Parse rows
    const rows = [];
    let maxColumns = 0;

    lines.forEach(line => {
      const cells = line.split(delimiterRegex).map(cell => cell.trim()).filter(c => c);
      if (cells.length > 1) {
        rows.push(cells);
        maxColumns = Math.max(maxColumns, cells.length);
      } else if (cells.length === 1 && cells[0]) {
        rows.push(cells);
      }
    });

    // Normalize row lengths
    rows.forEach(row => {
      while (row.length < maxColumns) {
        row.push('');
      }
    });

    // Check if this looks like a table (consistent column count)
    const columnCounts = rows.map(r => r.length);
    const mostCommonCount = this.getMostCommon(columnCounts);
    const consistentRows = columnCounts.filter(c => c === mostCommonCount).length;
    
    result.isTable = consistentRows > rows.length * 0.5 && mostCommonCount > 1;
    result.rows = rows;
    result.columnCount = maxColumns;

    return result;
  }

  // Check if a row looks like a header
  looksLikeHeader(row) {
    if (!row || row.length === 0) return false;
    
    // Headers typically have no numbers or are all text
    const hasNumbers = row.some(cell => /^\d+([.,]\d+)?$/.test(String(cell).trim()));
    const allText = row.every(cell => !/^\d+([.,]\d+)?$/.test(String(cell).trim()));
    
    // Headers often have shorter text
    const avgLength = row.reduce((sum, cell) => sum + String(cell).length, 0) / row.length;
    
    return allText || (!hasNumbers && avgLength < 30);
  }

  // Get most common value in array
  getMostCommon(arr) {
    const counts = {};
    arr.forEach(val => { counts[val] = (counts[val] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  }

  // Auto-fit columns in worksheet
  autoFitColumns(worksheet) {
    worksheet.columns.forEach((column, index) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, cell => {
        const cellValue = cell.value ? String(cell.value) : '';
        const length = cellValue.length;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
  }

  // PDF to PowerPoint conversion
  async pdfToPowerPoint(text, pageCount, filename) {
    console.log('Converting PDF to PowerPoint presentation...');

    try {
      const pptx = new PptxGenJS();
      pptx.author = 'RobotPDF Converter';
      pptx.title = `Converted from ${filename}`;

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText('PDF Conversion', {
        x: 1,
        y: 1,
        w: 8,
        h: 1,
        fontSize: 32,
        bold: true,
        align: 'center'
      });
      titleSlide.addText(`From: ${filename}`, {
        x: 1,
        y: 2.5,
        w: 8,
        h: 0.5,
        fontSize: 18,
        align: 'center'
      });
      titleSlide.addText(`Pages: ${pageCount}`, {
        x: 1,
        y: 3.5,
        w: 8,
        h: 0.5,
        fontSize: 14,
        align: 'center'
      });

      // Split text into chunks for slides
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      const slidesCount = Math.min(Math.ceil(paragraphs.length / 5), 20); // Max 20 slides

      for (let i = 0; i < slidesCount; i++) {
        const slide = pptx.addSlide();
        slide.addText(`Slide ${i + 1}`, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.5,
          fontSize: 20,
          bold: true
        });

        const startIdx = i * 5;
        const endIdx = Math.min(startIdx + 5, paragraphs.length);
        const slideText = paragraphs.slice(startIdx, endIdx).join('\n\n');

        slide.addText(slideText, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 5,
          fontSize: 12,
          valign: 'top'
        });
      }

      // Generate buffer
      const buffer = await pptx.write('nodebuffer');
      return buffer;
    } catch (error) {
      console.error('PDF to PowerPoint error:', error);
      throw new Error(`PDF to PowerPoint conversion failed: ${error.message}`);
    }
  }

  // PDF to RTF conversion
  async pdfToRtf(text, filename) {
    console.log('Converting PDF to RTF...');

    try {
      let rtfContent = '{\\rtf1\\ansi\\deff0\n';
      rtfContent += '{\\fonttbl{\\f0 Arial;}}\n';
      rtfContent += '{\\colortbl;\\red0\\green0\\blue0;}\n';
      
      // Add title
      rtfContent += `{\\fs32\\b Converted from: ${this.escapeRtf(filename)}\\par}\n`;
      rtfContent += '\\par\n';

      // Add content
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      paragraphs.forEach(para => {
        rtfContent += `{\\fs24 ${this.escapeRtf(para)}\\par}\n`;
        rtfContent += '\\par\n';
      });

      rtfContent += '}';

      return Buffer.from(rtfContent, 'utf-8');
    } catch (error) {
      console.error('PDF to RTF error:', error);
      throw new Error(`PDF to RTF conversion failed: ${error.message}`);
    }
  }

  // Escape special characters for RTF
  escapeRtf(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\par\n');
  }

  // Simple wrapper methods for v1 API
  async pdfToDocx(buffer) {
    return await this.convertPdfToOffice(buffer, 'docx', 'document.pdf');
  }

  async pdfBufferToExcel(buffer) {
    return await this.convertPdfToOffice(buffer, 'xlsx', 'document.pdf');
  }

  async pdfToPpt(buffer) {
    return await this.convertPdfToOffice(buffer, 'pptx', 'document.pdf');
  }

  // Get MIME type for output format
  getMimeType(format) {
    const mimeTypes = {
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'rtf': 'application/rtf',
      'txt': 'text/plain',
      'pdf': 'application/pdf'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}

module.exports = new OfficeConversionService();
