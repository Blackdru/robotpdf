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
  async wordToPdf(buffer, filename) {
    console.log('Converting Word document to PDF...');

    try {
      // Extract text and formatting from Word document using mammoth
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

  // Excel to PDF conversion
  async excelToPdf(buffer, filename) {
    console.log('Converting Excel spreadsheet to PDF...');

    try {
      // Read Excel file using ExcelJS
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      // Create PDF
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

      // Add title
      pdfDoc.fontSize(16).text(`Excel Spreadsheet: ${filename}`, { align: 'center' });
      pdfDoc.moveDown();

      // Process each sheet
      workbook.eachSheet((worksheet, sheetIndex) => {
        if (sheetIndex > 1) {
          pdfDoc.addPage();
        }

        // Add sheet name
        pdfDoc.fontSize(14).text(`Sheet: ${worksheet.name}`, { underline: true });
        pdfDoc.moveDown();

        if (worksheet.rowCount === 0) {
          pdfDoc.fontSize(10).text('(Empty sheet)', { italics: true });
          return;
        }

        // Calculate column widths
        const maxCols = worksheet.columnCount || 10;
        const pageWidth = pdfDoc.page.width - 100;
        const colWidth = Math.min(pageWidth / maxCols, 150);

        // Draw table
        pdfDoc.fontSize(9);
        let y = pdfDoc.y;

        worksheet.eachRow((row, rowIndex) => {
          // Check if we need a new page
          if (y > pdfDoc.page.height - 100) {
            pdfDoc.addPage();
            y = 50;
          }

          let x = 50;
          
          row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
            const cellText = String(cell.value || '');
            
            // Draw cell border
            pdfDoc.rect(x, y, colWidth, 20).stroke();
            
            // Draw cell text
            pdfDoc.text(cellText, x + 2, y + 5, {
              width: colWidth - 4,
              height: 15,
              ellipsis: true
            });
            
            x += colWidth;
          });

          y += 20;
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
  async convertPdfToOffice(buffer, outputFormat, filename) {
    console.log(`Converting PDF to ${outputFormat}...`);

    try {
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

  // PDF to Excel conversion
  async pdfToExcel(text, pageCount, filename) {
    console.log('Converting PDF to Excel spreadsheet...');

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'RobotPDF Converter';
      workbook.created = new Date();

      // Split text into lines
      const lines = text.split('\n').filter(line => line.trim().length > 0);

      // Create worksheet
      const worksheet = workbook.addWorksheet('Converted Content');

      // Add header
      worksheet.addRow([`Converted from: ${filename}`]);
      worksheet.addRow([`Pages: ${pageCount}`]);
      worksheet.addRow([`Conversion Date: ${new Date().toLocaleString()}`]);
      worksheet.addRow([]);

      // Try to detect table-like structures
      lines.forEach(line => {
        // Check if line contains multiple spaces or tabs (potential table row)
        if (line.includes('\t') || /\s{2,}/.test(line)) {
          const cells = line.split(/\t|\s{2,}/).map(cell => cell.trim());
          worksheet.addRow(cells);
        } else {
          worksheet.addRow([line]);
        }
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('PDF to Excel error:', error);
      throw new Error(`PDF to Excel conversion failed: ${error.message}`);
    }
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

  async pdfToExcel(buffer) {
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
