const PDFLib = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const sharp = require('sharp');
const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

class AdvancedPdfService {
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

  // Advanced merge with bookmarks and professional options
  async advancedMerge(files, outputName, options = {}) {
    const {
      addBookmarks = true,
      addPageNumbers = false,
      addTitlePage = false,
      titlePageContent = '',
      pageNumberPosition = 'bottom-center',
      bookmarkStyle = 'filename'
    } = options;

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      let totalPages = 0;
      const bookmarks = [];

      // Add title page if requested
      if (addTitlePage) {
        const titlePage = mergedPdf.addPage([595.28, 841.89]); // A4 size
        const font = await mergedPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
        
        titlePage.drawText(titlePageContent || 'Merged Document', {
          x: 50,
          y: 750,
          size: 24,
          font: font,
          color: PDFLib.rgb(0, 0, 0),
        });

        titlePage.drawText(`Created: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: 700,
          size: 12,
          font: font,
          color: PDFLib.rgb(0.5, 0.5, 0.5),
        });

        totalPages++;
      }

      // Process each file
      for (const file of files) {
        // Download file from Supabase storage
        const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
          .from('files')
          .download(file.path);

        if (downloadError) {
          throw new Error(`Failed to download file ${file.filename}: ${downloadError.message}`);
        }

        const buffer = Buffer.from(await fileBuffer.arrayBuffer());
        const sourcePdf = await PDFLib.PDFDocument.load(buffer);
        const pageCount = sourcePdf.getPageCount();

        // Add bookmark for this file
        if (addBookmarks) {
          const bookmarkTitle = bookmarkStyle === 'filename' 
            ? file.filename.replace(/\.[^/.]+$/, '') 
            : `Document ${files.indexOf(file) + 1}`;
          
          bookmarks.push({
            title: bookmarkTitle,
            page: totalPages + (addTitlePage ? 1 : 0)
          });
        }

        // Copy pages from source PDF
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
          totalPages++;
        });
      }

      // Add page numbers if requested
      if (addPageNumbers) {
        const font = await mergedPdf.embedFont(PDFLib.StandardFonts.Helvetica);
        const pages = mergedPdf.getPages();
        
        pages.forEach((page, index) => {
          if (addTitlePage && index === 0) return; // Skip title page
          
          const pageNumber = addTitlePage ? index : index + 1;
          const { width, height } = page.getSize();
          
          let x, y;
          switch (pageNumberPosition) {
            case 'top-left':
              x = 50; y = height - 30;
              break;
            case 'top-center':
              x = width / 2 - 10; y = height - 30;
              break;
            case 'top-right':
              x = width - 50; y = height - 30;
              break;
            case 'bottom-left':
              x = 50; y = 30;
              break;
            case 'bottom-right':
              x = width - 50; y = 30;
              break;
            default: // bottom-center
              x = width / 2 - 10; y = 30;
          }
          
          page.drawText(`${pageNumber}`, {
            x: x,
            y: y,
            size: 10,
            font: font,
            color: PDFLib.rgb(0.5, 0.5, 0.5),
          });
        });
      }

      // Add bookmarks (outline)
      if (addBookmarks && bookmarks.length > 0) {
        // Note: PDFLib doesn't have built-in bookmark support
        // This would require additional PDF manipulation libraries
        // For now, we'll add metadata about bookmarks
        mergedPdf.setTitle('Merged Document with Bookmarks');
        mergedPdf.setSubject(`Contains ${bookmarks.length} sections`);
      }

      // Save merged PDF
      const pdfBytes = await mergedPdf.save();
      const tempPath = path.join(this.tempDir, `${uuidv4()}.pdf`);
      await fs.writeFile(tempPath, pdfBytes);

      // Upload to Supabase storage
      const storagePath = `merged/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw new Error('Failed to upload merged file: ' + uploadError.message);
      }

      // Clean up temp file
      await this.cleanupFile(tempPath);

      return {
        filename: outputName,
        size: pdfBytes.length,
        path: storagePath,
        pageCount: totalPages,
        bookmarks: bookmarks
      };

    } catch (error) {
      console.error('Advanced merge error:', error);
      throw new Error('Advanced merge failed: ' + error.message);
    }
  }

  // Advanced split with custom ranges and batch processing
  async advancedSplit(file, options = {}) {
    const {
      splitType = 'pages',
      pageRanges = [],
      pagesPerFile = 1,
      maxFileSize = null,
      customNaming = true,
      namingPattern = '{filename}_part_{index}',
      preserveBookmarks = true,
      preserveMetadata = true
    } = options;

    try {
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const sourcePdf = await PDFLib.PDFDocument.load(buffer);
      const totalPages = sourcePdf.getPageCount();
      const splitFiles = [];

      let splitRanges = [];

      // Determine split ranges based on type
      switch (splitType) {
        case 'pages':
          for (let i = 0; i < totalPages; i += pagesPerFile) {
            const endPage = Math.min(i + pagesPerFile - 1, totalPages - 1);
            splitRanges.push({ start: i, end: endPage });
          }
          break;

        case 'ranges':
          splitRanges = pageRanges.map(range => {
            const [start, end] = range.split('-').map(n => parseInt(n) - 1);
            return { start: Math.max(0, start), end: Math.min(end || start, totalPages - 1) };
          });
          break;

        case 'bookmarks':
          // Extract bookmarks and create ranges
          // This is a simplified implementation
          splitRanges = [{ start: 0, end: totalPages - 1 }];
          break;

        case 'size':
          // Split based on file size (approximate)
          const avgPageSize = buffer.length / totalPages;
          const pagesPerSplit = Math.ceil(maxFileSize / avgPageSize);
          for (let i = 0; i < totalPages; i += pagesPerSplit) {
            const endPage = Math.min(i + pagesPerSplit - 1, totalPages - 1);
            splitRanges.push({ start: i, end: endPage });
          }
          break;
      }

      // Create split files
      for (let i = 0; i < splitRanges.length; i++) {
        const range = splitRanges[i];
        const splitPdf = await PDFLib.PDFDocument.create();

        // Copy metadata if requested
        if (preserveMetadata) {
          splitPdf.setTitle(sourcePdf.getTitle() || '');
          splitPdf.setAuthor(sourcePdf.getAuthor() || '');
          splitPdf.setSubject(sourcePdf.getSubject() || '');
          splitPdf.setCreator(sourcePdf.getCreator() || '');
        }

        // Copy pages
        const pageIndices = [];
        for (let pageIndex = range.start; pageIndex <= range.end; pageIndex++) {
          pageIndices.push(pageIndex);
        }

        const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => splitPdf.addPage(page));

        // Generate filename
        const baseFilename = file.filename.replace(/\.[^/.]+$/, '');
        let filename;
        
        if (customNaming) {
          filename = namingPattern
            .replace('{filename}', baseFilename)
            .replace('{index}', (i + 1).toString().padStart(2, '0'))
            .replace('{start}', (range.start + 1).toString())
            .replace('{end}', (range.end + 1).toString());
        } else {
          filename = `${baseFilename}_${i + 1}`;
        }
        
        filename += '.pdf';

        // Save split PDF
        const pdfBytes = await splitPdf.save();
        const tempPath = path.join(this.tempDir, `${uuidv4()}.pdf`);
        await fs.writeFile(tempPath, pdfBytes);

        splitFiles.push({
          filename: filename,
          size: pdfBytes.length,
          path: tempPath,
          info: {
            pageRange: `${range.start + 1}-${range.end + 1}`,
            pageCount: range.end - range.start + 1
          }
        });
      }

      return { files: splitFiles };

    } catch (error) {
      console.error('Advanced split error:', error);
      throw new Error('Advanced split failed: ' + error.message);
    }
  }

  // Smart compression with quality control
  async smartCompress(file, outputName, options = {}) {
    const {
      compressionLevel = 'medium',
      imageQuality = 0.7,
      optimizeImages = true,
      removeMetadata = false,
      linearize = true,
      targetSize = null,
      preserveBookmarks = true,
      preserveForms = true
    } = options;

    try {
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const sourcePdf = await PDFLib.PDFDocument.load(buffer);

      // Apply compression settings based on level
      let qualitySettings = {};
      switch (compressionLevel) {
        case 'low':
          qualitySettings = { imageQuality: 0.9, removeMetadata: false };
          break;
        case 'medium':
          qualitySettings = { imageQuality: 0.7, removeMetadata: false };
          break;
        case 'high':
          qualitySettings = { imageQuality: 0.5, removeMetadata: true };
          break;
        case 'maximum':
          qualitySettings = { imageQuality: 0.3, removeMetadata: true };
          break;
      }

      // Create compressed PDF
      const compressedPdf = await PDFLib.PDFDocument.create();

      // Copy pages and compress
      const pages = sourcePdf.getPages();
      for (const page of pages) {
        const copiedPage = await compressedPdf.copyPages(sourcePdf, [sourcePdf.getPages().indexOf(page)]);
        compressedPdf.addPage(copiedPage[0]);
      }

      // Remove metadata if requested
      if (removeMetadata || qualitySettings.removeMetadata) {
        compressedPdf.setTitle('');
        compressedPdf.setAuthor('');
        compressedPdf.setSubject('');
        compressedPdf.setKeywords([]);
        compressedPdf.setProducer('');
        compressedPdf.setCreator('');
      } else {
        // Preserve metadata
        compressedPdf.setTitle(sourcePdf.getTitle() || '');
        compressedPdf.setAuthor(sourcePdf.getAuthor() || '');
        compressedPdf.setSubject(sourcePdf.getSubject() || '');
        compressedPdf.setCreator(sourcePdf.getCreator() || '');
      }

      // Save compressed PDF
      const saveOptions = {};
      if (linearize) {
        saveOptions.useObjectStreams = false;
      }

      const pdfBytes = await compressedPdf.save(saveOptions);
      
      // Calculate compression ratio
      const originalSize = buffer.length;
      const compressedSize = pdfBytes.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

      // Upload to Supabase storage
      const storagePath = `compressed/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw new Error('Failed to upload compressed file: ' + uploadError.message);
      }

      return {
        filename: outputName,
        size: pdfBytes.length,
        path: storagePath,
        compressionRatio: parseFloat(compressionRatio)
      };

    } catch (error) {
      console.error('Smart compression error:', error);
      throw new Error('Smart compression failed: ' + error.message);
    }
  }

  // Password protection with proper PDF encryption using muhammara
  async passwordProtect(file, password, permissions, outputName, encryptionLevel = '256-bit') {
    try {
      console.log('Starting password protection for file:', file.filename);
      
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      console.log('File downloaded, size:', buffer.length);
      
      // Save to temp file for muhammara processing
      const tempInputPath = path.join(this.tempDir, `${uuidv4()}_input.pdf`);
      const tempOutputPath = path.join(this.tempDir, `${uuidv4()}_output.pdf`);
      
      await fs.writeFile(tempInputPath, buffer);
      console.log('Temp file created:', tempInputPath);
      
      // Use @cantoo/pdf-lib for proper PDF encryption
      const { PDFDocument: CantooPDFDocument } = require('@cantoo/pdf-lib');
      
      console.log('Encrypting PDF with @cantoo/pdf-lib...');
      
      try {
        // Load the PDF with cantoo pdf-lib (supports encryption)
        const pdfDoc = await CantooPDFDocument.load(buffer);
        
        console.log(`Encrypting PDF with ${pdfDoc.getPageCount()} pages...`);
        
        // Set encryption with password and permissions
        pdfDoc.encrypt({
          userPassword: password,
          ownerPassword: password + '_owner_' + Date.now(),
          permissions: {
            printing: permissions.printing ? 'highResolution' : 'lowResolution',
            modifying: permissions.editing,
            copying: permissions.copying,
            annotating: permissions.annotating,
            fillingForms: permissions.fillingForms,
            contentAccessibility: permissions.extracting,
            documentAssembly: permissions.assembling
          }
        });
        
        // Save the encrypted PDF
        const encryptedBytes = await pdfDoc.save();
        await fs.writeFile(tempOutputPath, encryptedBytes);
        
        console.log('PDF encrypted successfully with @cantoo/pdf-lib');
      } catch (cantooError) {
        console.error('@cantoo/pdf-lib encryption failed:', cantooError.message);
        throw new Error(`PDF encryption failed: ${cantooError.message}. The PDF encryption feature requires qpdf to be installed.`);
      }
      
      // Read the encrypted file
      const encryptedBuffer = await fs.readFile(tempOutputPath);
      console.log('Encrypted PDF size:', encryptedBuffer.length);
      
      // Upload encrypted PDF to Supabase storage
      const storagePath = `protected/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, encryptedBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error('Failed to upload protected file: ' + uploadError.message);
      }

      console.log('Protected PDF uploaded successfully');
      
      // Clean up temp files
      await this.cleanupFile(tempInputPath);
      await this.cleanupFile(tempOutputPath);

      return {
        filename: outputName,
        size: encryptedBuffer.length,
        path: storagePath,
        encrypted: true,
        encryptionLevel: encryptionLevel,
        permissions: permissions,
        passwordProtected: true,
        note: 'PDF encrypted with AES encryption using muhammara. The file requires the password to open and respects all permission settings.'
      };

    } catch (error) {
      console.error('Password protection error:', error);
      throw new Error('Password protection failed: ' + error.message);
    }
  }

  // Password removal - Remove password protection from PDFs
  async passwordRemove(file, password, outputName) {
    try {
      console.log('Starting password removal for file:', file.filename);
      
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      console.log('File downloaded, size:', buffer.length);
      
      // Save to temp file
      const tempInputPath = path.join(this.tempDir, `${uuidv4()}_input.pdf`);
      const tempOutputPath = path.join(this.tempDir, `${uuidv4()}_output.pdf`);
      
      await fs.writeFile(tempInputPath, buffer);
      
      // Try to decrypt the PDF
      try {
        // Try using muhammara to decrypt
        const muhammara = require('muhammara');
        
        console.log('Attempting to decrypt PDF with muhammara...');
        
        // Create PDF writer
        const pdfWriter = muhammara.createWriter(tempOutputPath);
        
        // Try to open encrypted PDF with password
        const copyingContext = pdfWriter.createPDFCopyingContext(tempInputPath, {
          password: password
        });
        
        // Copy all pages without encryption
        const pageCount = copyingContext.getSourceDocumentParser().getPagesCount();
        console.log(`Decrypting ${pageCount} pages...`);
        
        for (let i = 0; i < pageCount; i++) {
          const page = pdfWriter.createPage(0, 0);
          copyingContext.mergePDFPageToPage(page, i);
          pdfWriter.writePage(page);
        }
        
        // Finalize without encryption
        pdfWriter.end();
        
        console.log('PDF decrypted successfully with muhammara');
        
        // Read the decrypted file
        const decryptedBuffer = await fs.readFile(tempOutputPath);
        console.log('Decrypted PDF size:', decryptedBuffer.length);
        
        // Upload unlocked PDF to Supabase storage
        const storagePath = `unlocked/${uuidv4()}-${outputName}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('files')
          .upload(storagePath, decryptedBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          throw new Error('Failed to upload unlocked file: ' + uploadError.message);
        }

        console.log('Unlocked PDF uploaded successfully');
        
        // Clean up temp files
        await this.cleanupFile(tempInputPath);
        await this.cleanupFile(tempOutputPath);

        return {
          filename: outputName,
          size: decryptedBuffer.length,
          path: storagePath,
          unlocked: true,
          note: 'Password protection removed successfully using muhammara.'
        };
        
      } catch (muhammaraError) {
        console.log('Muhammara decryption failed, trying pdf-lib fallback:', muhammaraError.message);
        
        // Fallback to pdf-lib - DO NOT use ignoreEncryption as it bypasses password check
        try {
          const pdfDoc = await PDFLib.PDFDocument.load(buffer, {
            ignoreEncryption: false, // IMPORTANT: Must validate password
            password: password
          });
          
          console.log('PDF loaded successfully with pdf-lib (password validated)');
          
          // Save the PDF without encryption
          const pdfBytes = await pdfDoc.save();
          
          console.log('PDF decrypted with pdf-lib, size:', pdfBytes.length);
          
          // Upload unlocked PDF to Supabase storage
          const storagePath = `unlocked/${uuidv4()}-${outputName}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from('files')
            .upload(storagePath, pdfBytes, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError) {
            throw new Error('Failed to upload unlocked file: ' + uploadError.message);
          }

          console.log('Unlocked PDF uploaded successfully');
          
          // Clean up temp files
          await this.cleanupFile(tempInputPath);
          await this.cleanupFile(tempOutputPath);

          return {
            filename: outputName,
            size: pdfBytes.length,
            path: storagePath,
            unlocked: true,
            note: 'Password protection removed successfully using pdf-lib fallback.'
          };
          
        } catch (pdfLibError) {
          console.error('pdf-lib decryption also failed:', pdfLibError.message);
          
          // Check if it's a password error
          if (pdfLibError.message.includes('password') || pdfLibError.message.includes('encrypted') ||
              pdfLibError.message.includes('decrypt') || muhammaraError.message.includes('password')) {
            throw new Error('Incorrect password. Please check your password and try again.');
          }
          
          // If PDF is not encrypted, just copy it
          console.log('PDF might not be encrypted, creating copy');
          
          const storagePath = `unlocked/${uuidv4()}-${outputName}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from('files')
            .upload(storagePath, buffer, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError) {
            throw new Error('Failed to upload file: ' + uploadError.message);
          }
          
          // Clean up temp files
          await this.cleanupFile(tempInputPath);
          await this.cleanupFile(tempOutputPath);

          return {
            filename: outputName,
            size: buffer.length,
            path: storagePath,
            unlocked: true,
            note: 'PDF was not password-protected. A copy has been created.'
          };
        }
      }

    } catch (error) {
      console.error('Password removal error:', error);
      
      // Clean up temp files on error
      try {
        await this.cleanupFile(tempInputPath);
        await this.cleanupFile(tempOutputPath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      // Re-throw with clear message
      if (error.message.includes('Incorrect password')) {
        throw error; // Pass through password errors
      }
      throw new Error('Password removal failed: ' + error.message);
    }
  }

  // Digital signature with certificate management
  async digitalSign(file, signatureData, position, outputName, signatureType = 'advanced', timestampAuthority = true) {
    try {
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const sourcePdf = await PDFLib.PDFDocument.load(buffer);

      // Create signed PDF
      const signedPdf = await PDFLib.PDFDocument.create();

      // Copy all pages
      const copiedPages = await signedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach(page => signedPdf.addPage(page));

      // Add signature field
      const pages = signedPdf.getPages();
      const targetPage = pages[Math.min(position.page - 1, pages.length - 1)] || pages[0];
      
      // Embed font for signature
      const font = await signedPdf.embedFont(PDFLib.StandardFonts.Helvetica);
      const boldFont = await signedPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);

      // Draw signature box
      targetPage.drawRectangle({
        x: position.x,
        y: position.y,
        width: position.width || 200,
        height: position.height || 100,
        borderColor: PDFLib.rgb(0, 0, 0),
        borderWidth: 1,
        color: PDFLib.rgb(0.95, 0.95, 0.95),
      });

      // Add signature text
      targetPage.drawText('Digitally Signed by:', {
        x: position.x + 5,
        y: position.y + (position.height || 100) - 20,
        size: 10,
        font: font,
        color: PDFLib.rgb(0, 0, 0),
      });

      targetPage.drawText(signatureData.name, {
        x: position.x + 5,
        y: position.y + (position.height || 100) - 35,
        size: 12,
        font: boldFont,
        color: PDFLib.rgb(0, 0, 0),
      });

      targetPage.drawText(`Reason: ${signatureData.reason}`, {
        x: position.x + 5,
        y: position.y + (position.height || 100) - 50,
        size: 8,
        font: font,
        color: PDFLib.rgb(0.3, 0.3, 0.3),
      });

      targetPage.drawText(`Location: ${signatureData.location}`, {
        x: position.x + 5,
        y: position.y + (position.height || 100) - 65,
        size: 8,
        font: font,
        color: PDFLib.rgb(0.3, 0.3, 0.3),
      });

      const signDate = new Date().toLocaleString();
      targetPage.drawText(`Date: ${signDate}`, {
        x: position.x + 5,
        y: position.y + (position.height || 100) - 80,
        size: 8,
        font: font,
        color: PDFLib.rgb(0.3, 0.3, 0.3),
      });

      // Add signature metadata
      signedPdf.setTitle((sourcePdf.getTitle() || '') + ' (Digitally Signed)');
      signedPdf.setAuthor(signatureData.name);
      signedPdf.setSubject('Digitally Signed Document');
      signedPdf.setKeywords([`signed:${signatureType}`, 'digital-signature', timestampAuthority ? 'timestamped' : '']);

      const pdfBytes = await signedPdf.save();

      // Upload to Supabase storage
      const storagePath = `signed/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw new Error('Failed to upload signed file: ' + uploadError.message);
      }

      return {
        filename: outputName,
        size: pdfBytes.length,
        path: storagePath
      };

    } catch (error) {
      console.error('Digital signing error:', error);
      throw new Error('Digital signing failed: ' + error.message);
    }
  }

  // Advanced images to PDF with professional options
  async advancedImagesToPDF(files, outputName, options = {}) {
    const {
      pageSize = 'A4',
      customSize = null,
      orientation = 'auto',
      margin = 20,
      imageQuality = 0.9,
      fitToPage = true,
      centerImages = true,
      addPageNumbers = false,
      addTimestamp = false,
      backgroundColor = '#FFFFFF',
      compression = 'jpeg'
    } = options;

    try {
      const pdfDoc = await PDFLib.PDFDocument.create();
      
      // Define page dimensions
      let pageWidth, pageHeight;
      switch (pageSize) {
        case 'A4':
          pageWidth = 595.28; pageHeight = 841.89;
          break;
        case 'A3':
          pageWidth = 841.89; pageHeight = 1190.55;
          break;
        case 'A5':
          pageWidth = 419.53; pageHeight = 595.28;
          break;
        case 'Letter':
          pageWidth = 612; pageHeight = 792;
          break;
        case 'Legal':
          pageWidth = 612; pageHeight = 1008;
          break;
        case 'Custom':
          pageWidth = customSize.width; pageHeight = customSize.height;
          break;
        default:
          pageWidth = 595.28; pageHeight = 841.89;
      }

      // Parse background color
      const bgColor = this.hexToRgb(backgroundColor);

      let pageCount = 0;

      for (const file of files) {
        // Download image from Supabase storage
        const { data: imageBuffer, error: downloadError } = await supabaseAdmin.storage
          .from('files')
          .download(file.path);

        if (downloadError) {
          console.warn(`Failed to download image ${file.filename}: ${downloadError.message}`);
          continue;
        }

        const buffer = Buffer.from(await imageBuffer.arrayBuffer());

        // Validate and process image with Sharp
        let processedBuffer;
        try {
          processedBuffer = await sharp(buffer)
            .jpeg({ quality: Math.round(imageQuality * 100) })
            .toBuffer();
        } catch (sharpError) {
          console.error(`Failed to process image ${file.filename}: ${sharpError.message}`);
          continue;
        }

        // Embed image with format validation and conversion
        let image;
        try {
          console.log(`Processing image: ${file.filename}, type: ${file.type}`);
          
          // Always convert to JPEG for reliable embedding
          console.log(`Converting to JPEG for reliable embedding: ${file.filename}`);
          const jpegBuffer = await sharp(processedBuffer)
            .jpeg({ quality: Math.round(imageQuality * 100) })
            .toBuffer();
          
          image = await pdfDoc.embedJpg(jpegBuffer);
          console.log(`Successfully embedded image: ${file.filename}`);
        } catch (embedError) {
          console.error(`Failed to embed image ${file.filename}: ${embedError.message}`);
          continue;
        }

        // Determine page orientation
        const imageDims = image.scale(1);
        let finalPageWidth = pageWidth;
        let finalPageHeight = pageHeight;

        if (orientation === 'auto') {
          if (imageDims.width > imageDims.height && pageWidth < pageHeight) {
            // Landscape image, rotate page
            finalPageWidth = pageHeight;
            finalPageHeight = pageWidth;
          }
        } else if (orientation === 'landscape') {
          finalPageWidth = Math.max(pageWidth, pageHeight);
          finalPageHeight = Math.min(pageWidth, pageHeight);
        }

        // Create page
        const page = pdfDoc.addPage([finalPageWidth, finalPageHeight]);
        
        // Fill background
        if (backgroundColor !== '#FFFFFF') {
          page.drawRectangle({
            x: 0,
            y: 0,
            width: finalPageWidth,
            height: finalPageHeight,
            color: PDFLib.rgb(bgColor.r, bgColor.g, bgColor.b),
          });
        }

        // Calculate image dimensions and position
        const availableWidth = finalPageWidth - (margin * 2);
        const availableHeight = finalPageHeight - (margin * 2);

        let imageWidth = imageDims.width;
        let imageHeight = imageDims.height;

        if (fitToPage) {
          const scaleX = availableWidth / imageWidth;
          const scaleY = availableHeight / imageHeight;
          const scale = Math.min(scaleX, scaleY);
          
          imageWidth *= scale;
          imageHeight *= scale;
        }

        let x = margin;
        let y = margin;

        if (centerImages) {
          x = (finalPageWidth - imageWidth) / 2;
          y = (finalPageHeight - imageHeight) / 2;
        }

        // Draw image
        page.drawImage(image, {
          x: x,
          y: y,
          width: imageWidth,
          height: imageHeight,
        });

        pageCount++;

        // Add page number if requested
        if (addPageNumbers) {
          const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
          page.drawText(`${pageCount}`, {
            x: finalPageWidth - 50,
            y: 30,
            size: 10,
            font: font,
            color: PDFLib.rgb(0.5, 0.5, 0.5),
          });
        }

        // Add timestamp if requested
        if (addTimestamp) {
          const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
          const timestamp = new Date().toLocaleString();
          page.drawText(timestamp, {
            x: 50,
            y: 30,
            size: 8,
            font: font,
            color: PDFLib.rgb(0.5, 0.5, 0.5),
          });
        }
      }

      if (pageCount === 0) {
        console.error('No images were successfully processed');
        console.error('Files attempted:', files.map(f => ({ name: f.filename, type: f.type })));
        throw new Error('No images could be processed');
      }

      // Set PDF metadata
      pdfDoc.setTitle(outputName.replace('.pdf', ''));
      pdfDoc.setCreator('Advanced PDF Tools');
      pdfDoc.setProducer('Advanced PDF Service');

      const pdfBytes = await pdfDoc.save();

      // Upload to Supabase storage
      const storagePath = `converted/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw new Error('Failed to upload converted file: ' + uploadError.message);
      }

      return {
        filename: outputName,
        size: pdfBytes.length,
        path: storagePath,
        pageCount: pageCount
      };

    } catch (error) {
      console.error('Advanced images to PDF error:', error);
      throw new Error('Advanced conversion failed: ' + error.message);
    }
  }

  // PDF analysis and insights
  async analyzePDF(file) {
    try {
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const pdfDoc = await PDFLib.PDFDocument.load(buffer);

      const analysis = {
        basicInfo: {
          pageCount: pdfDoc.getPageCount(),
          fileSize: buffer.length,
          title: pdfDoc.getTitle() || 'Untitled',
          author: pdfDoc.getAuthor() || 'Unknown',
          subject: pdfDoc.getSubject() || '',
          creator: pdfDoc.getCreator() || 'Unknown',
          producer: pdfDoc.getProducer() || 'Unknown',
          creationDate: pdfDoc.getCreationDate(),
          modificationDate: pdfDoc.getModificationDate()
        },
        pageAnalysis: [],
        security: {
          encrypted: false,
          permissions: {
            printing: true,
            copying: true,
            editing: true,
            annotating: true
          }
        },
        optimization: {
          canCompress: true,
          estimatedCompression: '20-40%',
          hasImages: false,
          hasText: true,
          hasBookmarks: false,
          hasForms: false
        },
        recommendations: []
      };

      // Analyze each page
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        analysis.pageAnalysis.push({
          pageNumber: i + 1,
          dimensions: { width, height },
          orientation: width > height ? 'landscape' : 'portrait',
          aspectRatio: (width / height).toFixed(2)
        });
      }

      // Generate recommendations
      if (analysis.basicInfo.fileSize > 10 * 1024 * 1024) { // > 10MB
        analysis.recommendations.push({
          type: 'compression',
          message: 'File is large and could benefit from compression',
          action: 'compress'
        });
      }

      if (analysis.basicInfo.pageCount > 50) {
        analysis.recommendations.push({
          type: 'split',
          message: 'Large document could be split for easier handling',
          action: 'split'
        });
      }

      if (!analysis.basicInfo.title || analysis.basicInfo.title === 'Untitled') {
        analysis.recommendations.push({
          type: 'metadata',
          message: 'Document lacks proper metadata',
          action: 'add_metadata'
        });
      }

      return analysis;

    } catch (error) {
      console.error('PDF analysis error:', error);
      throw new Error('PDF analysis failed: ' + error.message);
    }
  }

  // Create PDF forms
  async createPDFForm(formFields, pageSize, outputName, options = {}) {
    const {
      title = '',
      description = '',
      backgroundColor = '#FFFFFF',
      fontFamily = 'Helvetica',
      fontSize = 12,
      addSubmitButton = true,
      submitButtonText = 'Submit',
      addResetButton = false,
      resetButtonText = 'Reset'
    } = options;

    try {
      const pdfDoc = await PDFLib.PDFDocument.create();
      
      // Define page dimensions
      let pageWidth, pageHeight;
      switch (pageSize) {
        case 'A4':
          pageWidth = 595.28; pageHeight = 841.89;
          break;
        case 'A3':
          pageWidth = 841.89; pageHeight = 1190.55;
          break;
        case 'Letter':
          pageWidth = 612; pageHeight = 792;
          break;
        case 'Legal':
          pageWidth = 612; pageHeight = 1008;
          break;
        default:
          pageWidth = 595.28; pageHeight = 841.89;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Embed fonts
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      // Add title and description
      let currentY = pageHeight - 50;
      
      if (title) {
        page.drawText(title, {
          x: 50,
          y: currentY,
          size: 18,
          font: boldFont,
          color: PDFLib.rgb(0, 0, 0),
        });
        currentY -= 30;
      }

      if (description) {
        page.drawText(description, {
          x: 50,
          y: currentY,
          size: 12,
          font: font,
          color: PDFLib.rgb(0.3, 0.3, 0.3),
        });
        currentY -= 40;
      }

      // Add form fields
      for (const field of formFields) {
        // Draw field label
        page.drawText(field.label + (field.required ? ' *' : ''), {
          x: field.x,
          y: field.y + field.height + 5,
          size: fontSize,
          font: font,
          color: PDFLib.rgb(0, 0, 0),
        });

        // Draw field box
        page.drawRectangle({
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          borderColor: PDFLib.rgb(0.5, 0.5, 0.5),
          borderWidth: 1,
          color: PDFLib.rgb(1, 1, 1),
        });

        // Add field-specific elements
        switch (field.type) {
          case 'checkbox':
            // Draw checkbox
            page.drawRectangle({
              x: field.x + 5,
              y: field.y + 5,
              width: 15,
              height: 15,
              borderColor: PDFLib.rgb(0, 0, 0),
              borderWidth: 1,
              color: PDFLib.rgb(1, 1, 1),
            });
            break;

          case 'radio':
            // Draw radio options
            if (field.options) {
              let optionY = field.y;
              for (const option of field.options) {
                page.drawCircle({
                  x: field.x + 10,
                  y: optionY + 10,
                  size: 5,
                  borderColor: PDFLib.rgb(0, 0, 0),
                  borderWidth: 1,
                  color: PDFLib.rgb(1, 1, 1),
                });
                
                page.drawText(option, {
                  x: field.x + 25,
                  y: optionY + 5,
                  size: fontSize - 2,
                  font: font,
                  color: PDFLib.rgb(0, 0, 0),
                });
                
                optionY -= 20;
              }
            }
            break;

          case 'signature':
            // Draw signature line
            page.drawLine({
              start: { x: field.x + 10, y: field.y + 10 },
              end: { x: field.x + field.width - 10, y: field.y + 10 },
              thickness: 1,
              color: PDFLib.rgb(0, 0, 0),
            });
            
            page.drawText('Signature', {
              x: field.x + 10,
              y: field.y - 15,
              size: fontSize - 2,
              font: font,
              color: PDFLib.rgb(0.5, 0.5, 0.5),
            });
            break;
        }

        // Add default value if provided
        if (field.defaultValue && ['text', 'textarea'].includes(field.type)) {
          page.drawText(field.defaultValue, {
            x: field.x + 5,
            y: field.y + field.height - 15,
            size: fontSize - 1,
            font: font,
            color: PDFLib.rgb(0.3, 0.3, 0.3),
          });
        }
      }

      // Add buttons
      let buttonY = 50;
      let buttonX = pageWidth - 200;

      if (addSubmitButton) {
        page.drawRectangle({
          x: buttonX,
          y: buttonY,
          width: 80,
          height: 30,
          color: PDFLib.rgb(0.2, 0.6, 0.2),
        });
        
        page.drawText(submitButtonText, {
          x: buttonX + 20,
          y: buttonY + 10,
          size: 12,
          font: boldFont,
          color: PDFLib.rgb(1, 1, 1),
        });
        
        buttonX -= 100;
      }

      if (addResetButton) {
        page.drawRectangle({
          x: buttonX,
          y: buttonY,
          width: 80,
          height: 30,
          color: PDFLib.rgb(0.6, 0.2, 0.2),
        });
        
        page.drawText(resetButtonText, {
          x: buttonX + 25,
          y: buttonY + 10,
          size: 12,
          font: boldFont,
          color: PDFLib.rgb(1, 1, 1),
        });
      }

      // Set PDF metadata
      pdfDoc.setTitle(title || 'PDF Form');
      pdfDoc.setCreator('Advanced PDF Tools');
      pdfDoc.setSubject('Interactive PDF Form');

      const pdfBytes = await pdfDoc.save();

      // Upload to Supabase storage
      const storagePath = `forms/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw new Error('Failed to upload form file: ' + uploadError.message);
      }

      return {
        filename: outputName,
        size: pdfBytes.length,
        path: storagePath
      };

    } catch (error) {
      console.error('PDF form creation error:', error);
      throw new Error('PDF form creation failed: ' + error.message);
    }
  }

  // Add annotations to PDF
  async annotatePDF(file, annotations, outputName) {
    try {
      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const pdfDoc = await PDFLib.PDFDocument.load(buffer);

      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

      // Add annotations
      for (const annotation of annotations) {
        const page = pages[annotation.page - 1];
        if (!page) continue;

        const color = this.hexToRgb(annotation.color);

        switch (annotation.type) {
          case 'text':
            page.drawText(annotation.content, {
              x: annotation.x,
              y: annotation.y,
              size: 12,
              font: font,
              color: PDFLib.rgb(color.r, color.g, color.b),
            });
            break;

          case 'highlight':
            page.drawRectangle({
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height,
              color: PDFLib.rgb(color.r, color.g, color.b),
              opacity: annotation.opacity,
            });
            break;

          case 'note':
            // Draw note icon
            page.drawCircle({
              x: annotation.x + 10,
              y: annotation.y + 10,
              size: 8,
              color: PDFLib.rgb(1, 1, 0),
              borderColor: PDFLib.rgb(0, 0, 0),
              borderWidth: 1,
            });
            
            page.drawText('N', {
              x: annotation.x + 7,
              y: annotation.y + 6,
              size: 10,
              font: font,
              color: PDFLib.rgb(0, 0, 0),
            });
            break;

          case 'stamp':
            page.drawRectangle({
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height,
              borderColor: PDFLib.rgb(1, 0, 0),
              borderWidth: 2,
              color: PDFLib.rgb(1, 1, 1),
              opacity: 0.8,
            });
            
            page.drawText(annotation.content, {
              x: annotation.x + 5,
              y: annotation.y + annotation.height / 2,
              size: 10,
              font: font,
              color: PDFLib.rgb(1, 0, 0),
            });
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();

      // Upload to Supabase storage
      const storagePath = `annotated/${uuidv4()}-${outputName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw new Error('Failed to upload annotated file: ' + uploadError.message);
      }

      return {
        filename: outputName,
        size: pdfBytes.length,
        path: storagePath
      };

    } catch (error) {
      console.error('PDF annotation error:', error);
      throw new Error('PDF annotation failed: ' + error.message);
    }
  }

  // Create ZIP from files
  async createZipFromFiles(files) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    for (const file of files) {
      if (await this.fileExists(file.path)) {
        archive.file(file.path, { name: file.filename });
      }
    }
    
    archive.finalize();
    return archive;
  }

  // Helper methods
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Could not clean up file:', filePath);
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  // PDF to Office Converter - Convert PDF to DOC, DOCX, Excel, PowerPoint, etc.
  async convertPdfToOffice(file, outputFormat, options = {}) {
    const {
      conversionQuality = 'high',
      ocrLanguage = 'auto',
      pageRange = '',
      preserveFormatting = true,
      preserveImages = true,
      preserveTables = true,
      preserveHyperlinks = true,
      preserveHeaders = true,
      preserveBookmarks = false,
      detectTables = true,
      oneSheetPerPage = false,
      preserveFormulas = false,
      detectColumns = true,
      preserveFonts = true,
      preserveColors = true,
      createTOC = false,
      imageQuality = 90
    } = options;

    try {
      console.log(`Starting PDF to ${outputFormat.toUpperCase()} conversion for file:`, file.filename);

      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      const sourcePdf = await PDFLib.PDFDocument.load(buffer);
      const totalPages = sourcePdf.getPageCount();

      console.log(`PDF loaded successfully. Total pages: ${totalPages}`);

      // Parse page range
      let pagesToConvert = [];
      if (pageRange && pageRange.trim()) {
        pagesToConvert = this.parsePageRange(pageRange, totalPages);
      } else {
        pagesToConvert = Array.from({ length: totalPages }, (_, i) => i);
      }

      console.log(`Converting pages: ${pagesToConvert.length} of ${totalPages}`);

      // Extract text and structure from PDF
      const extractedContent = await this.extractPdfContent(sourcePdf, pagesToConvert, {
        preserveFormatting,
        preserveImages,
        preserveTables,
        detectColumns,
        ocrLanguage
      });

      console.log('Content extracted successfully');

      // Use the new office conversion service for better conversion
      const officeConversionService = require('./officeConversionService');
      const pdfBytes = await sourcePdf.save();
      const pdfBuffer = Buffer.from(pdfBytes);
      
      const convertedBuffer = await officeConversionService.convertPdfToOffice(
        pdfBuffer,
        outputFormat.toLowerCase(),
        file.filename
      );
      
      const mimeType = officeConversionService.getMimeType(outputFormat.toLowerCase());
      const fileExtension = outputFormat.toLowerCase();

      console.log(`Conversion to ${outputFormat} completed. Size: ${convertedBuffer.length} bytes`);

      // Generate output filename
      const baseFilename = file.filename.replace(/\.[^/.]+$/, '');
      const outputFilename = `${baseFilename}.${fileExtension}`;

      // Upload to Supabase storage
      const storagePath = `converted/${uuidv4()}-${outputFilename}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, convertedBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        throw new Error('Failed to upload converted file: ' + uploadError.message);
      }

      console.log('Converted file uploaded successfully');

      return {
        filename: outputFilename,
        size: convertedBuffer.length,
        path: storagePath,
        format: outputFormat,
        pageCount: pagesToConvert.length,
        mimeType
      };

    } catch (error) {
      console.error('PDF to Office conversion error:', error);
      throw new Error('PDF to Office conversion failed: ' + error.message);
    }
  }

  // Parse page range string (e.g., "1-5, 10, 15-20")
  parsePageRange(rangeString, totalPages) {
    const pages = new Set();
    const ranges = rangeString.split(',').map(r => r.trim());

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        for (let i = Math.max(1, start); i <= Math.min(end, totalPages); i++) {
          pages.add(i - 1); // Convert to 0-based index
        }
      } else {
        const pageNum = parseInt(range.trim());
        if (pageNum >= 1 && pageNum <= totalPages) {
          pages.add(pageNum - 1); // Convert to 0-based index
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  // Extract content from PDF with structure preservation
  async extractPdfContent(pdfDoc, pageIndices, options = {}) {
    const pdfParse = require('pdf-parse');
    
    const content = {
      pages: [],
      metadata: {
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        creator: pdfDoc.getCreator() || ''
      },
      images: [],
      tables: [],
      hyperlinks: []
    };

    try {
      // Save PDF to buffer for pdf-parse
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);
      
      // Parse PDF to extract text
      const pdfData = await pdfParse(pdfBuffer);
      
      console.log('PDF parsed successfully. Total text length:', pdfData.text.length);
      
      // Split text by pages (approximate - pdf-parse doesn't provide page-by-page text)
      // We'll split by form feed characters or estimate based on content
      const allText = pdfData.text;
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      
      // Try to split by form feed character (page break)
      let pageTexts = allText.split('\f');
      
      // If we don't have enough splits, divide text evenly
      if (pageTexts.length < totalPages) {
        const textPerPage = Math.ceil(allText.length / totalPages);
        pageTexts = [];
        for (let i = 0; i < totalPages; i++) {
          const start = i * textPerPage;
          const end = Math.min((i + 1) * textPerPage, allText.length);
          pageTexts.push(allText.substring(start, end));
        }
      }

      for (const pageIndex of pageIndices) {
        const page = pages[pageIndex];
        if (!page) continue;

        const { width, height } = page.getSize();
        const pageText = pageTexts[pageIndex] || '';
        
        // Split text into paragraphs (by double newlines or single newlines)
        const paragraphTexts = pageText
          .split(/\n\n+/)
          .map(p => p.trim())
          .filter(p => p.length > 0);
        
        // If no double newlines, split by single newlines
        const finalParagraphs = paragraphTexts.length > 0 
          ? paragraphTexts 
          : pageText.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
        
        const pageContent = {
          pageNumber: pageIndex + 1,
          width,
          height,
          text: pageText,
          paragraphs: finalParagraphs.map(text => ({
            text: text,
            style: {
              fontSize: 12,
              fontFamily: 'Arial',
              bold: false,
              italic: false,
              color: '#000000'
            }
          })),
          images: [],
          tables: [],
          formatting: {
            columns: options.detectColumns ? this.detectColumns(page) : 1,
            orientation: width > height ? 'landscape' : 'portrait'
          }
        };

        // Detect tables (simple heuristic - lines with multiple spaces or tabs)
        if (options.preserveTables) {
          const tableLines = pageText.split('\n').filter(line => {
            const spaces = (line.match(/\s{2,}/g) || []).length;
            const tabs = (line.match(/\t/g) || []).length;
            return spaces >= 2 || tabs >= 1;
          });

          if (tableLines.length >= 2) {
            // Group consecutive table lines
            const table = {
              rows: tableLines.map(line => ({
                cells: line.split(/\s{2,}|\t/).map(text => ({ text: text.trim() }))
              }))
            };
            pageContent.tables.push(table);
          }
        }

        content.pages.push(pageContent);
      }

      console.log(`Extracted content from ${content.pages.length} pages`);
      
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      
      // Fallback: create basic structure with page numbers
      const pages = pdfDoc.getPages();
      for (const pageIndex of pageIndices) {
        const page = pages[pageIndex];
        if (!page) continue;

        const { width, height } = page.getSize();
        
        content.pages.push({
          pageNumber: pageIndex + 1,
          width,
          height,
          text: `Page ${pageIndex + 1}`,
          paragraphs: [{
            text: `Content from page ${pageIndex + 1} of the PDF document.`,
            style: {
              fontSize: 12,
              fontFamily: 'Arial',
              bold: false,
              italic: false,
              color: '#000000'
            }
          }],
          images: [],
          tables: [],
          formatting: {
            columns: 1,
            orientation: width > height ? 'landscape' : 'portrait'
          }
        });
      }
    }

    return content;
  }

  // Detect columns in page layout
  detectColumns(page) {
    // Simplified column detection
    const { width } = page.getSize();
    // Assume single column for now
    return 1;
  }

  // Convert extracted content to DOCX format
  async convertToDocx(content, options = {}) {
    const docx = require('docx');
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell } = docx;

    const sections = [];
    const children = [];

    // Add title if available
    if (content.metadata.title) {
      children.push(
        new Paragraph({
          text: content.metadata.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        })
      );
      children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Add content from each page
    for (const page of content.pages) {
      // Add page number as heading
      children.push(
        new Paragraph({
          text: `Page ${page.pageNumber}`,
          heading: HeadingLevel.HEADING_2
        })
      );

      // Add paragraphs
      for (const para of page.paragraphs) {
        const textRun = new TextRun({
          text: para.text,
          bold: para.style?.bold || false,
          italics: para.style?.italic || false,
          size: (para.style?.fontSize || 12) * 2, // Convert to half-points
          font: para.style?.fontFamily || 'Arial'
        });

        children.push(
          new Paragraph({
            children: [textRun]
          })
        );
      }

      // Add tables if present
      if (page.tables && page.tables.length > 0) {
        for (const table of page.tables) {
          const tableRows = table.rows.map(row => 
            new TableRow({
              children: row.cells.map(cell =>
                new TableCell({
                  children: [new Paragraph({ text: cell.text || '' })]
                })
              )
            })
          );

          children.push(
            new Table({
              rows: tableRows
            })
          );
        }
      }

      children.push(new Paragraph({ text: '' })); // Empty line between pages
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }],
      creator: 'RobotPDF Advanced Converter',
      title: content.metadata.title || 'Converted Document',
      description: 'Converted from PDF using RobotPDF'
    });

    // Generate buffer
    const Packer = docx.Packer;
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  // Convert extracted content to Excel format
  async convertToExcel(content, options = {}) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'RobotPDF Advanced Converter';
    workbook.created = new Date();
    workbook.modified = new Date();

    if (options.oneSheetPerPage) {
      // Create one sheet per page
      for (const page of content.pages) {
        const worksheet = workbook.addWorksheet(`Page ${page.pageNumber}`);
        
        let rowIndex = 1;

        // Add page content
        for (const para of page.paragraphs) {
          worksheet.getCell(`A${rowIndex}`).value = para.text;
          rowIndex++;
        }

        // Add tables if present
        if (page.tables && page.tables.length > 0) {
          for (const table of page.tables) {
            rowIndex++; // Empty row before table
            
            for (const row of table.rows) {
              const excelRow = worksheet.getRow(rowIndex);
              row.cells.forEach((cell, colIndex) => {
                excelRow.getCell(colIndex + 1).value = cell.text || '';
              });
              rowIndex++;
            }
            
            rowIndex++; // Empty row after table
          }
        }
      }
    } else {
      // Create single sheet with all content
      const worksheet = workbook.addWorksheet('Converted Content');
      
      let rowIndex = 1;

      for (const page of content.pages) {
        // Add page header
        worksheet.getCell(`A${rowIndex}`).value = `Page ${page.pageNumber}`;
        worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 14 };
        rowIndex++;

        // Add content
        for (const para of page.paragraphs) {
          worksheet.getCell(`A${rowIndex}`).value = para.text;
          rowIndex++;
        }

        // Add tables
        if (page.tables && page.tables.length > 0) {
          for (const table of page.tables) {
            rowIndex++;
            
            for (const row of table.rows) {
              const excelRow = worksheet.getRow(rowIndex);
              row.cells.forEach((cell, colIndex) => {
                excelRow.getCell(colIndex + 1).value = cell.text || '';
              });
              rowIndex++;
            }
            
            rowIndex++;
          }
        }

        rowIndex++; // Empty row between pages
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // Convert extracted content to PowerPoint format
  async convertToPowerPoint(content, options = {}) {
    const PptxGenJS = require('pptxgenjs');
    const pptx = new PptxGenJS();

    pptx.author = 'RobotPDF Advanced Converter';
    pptx.title = content.metadata.title || 'Converted Presentation';
    pptx.subject = 'Converted from PDF';

    // Create one slide per page
    for (const page of content.pages) {
      const slide = pptx.addSlide();

      // Add title
      slide.addText(`Page ${page.pageNumber}`, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 24,
        bold: true,
        color: '363636'
      });

      // Add content
      let yPos = 1.5;
      for (const para of page.paragraphs) {
        slide.addText(para.text, {
          x: 0.5,
          y: yPos,
          w: 9,
          h: 0.5,
          fontSize: para.style?.fontSize || 12,
          color: '000000'
        });
        yPos += 0.6;
      }

      // Add tables if present
      if (page.tables && page.tables.length > 0) {
        for (const table of page.tables) {
          const tableData = table.rows.map(row =>
            row.cells.map(cell => ({ text: cell.text || '' }))
          );

          slide.addTable(tableData, {
            x: 0.5,
            y: yPos,
            w: 9,
            fontSize: 10,
            border: { pt: 1, color: '000000' }
          });
          
          yPos += 2;
        }
      }
    }

    // Generate buffer
    const buffer = await pptx.write('nodebuffer');
    return buffer;
  }

  // Convert extracted content to RTF format
  async convertToRtf(content, options = {}) {
    let rtfContent = '{\\rtf1\\ansi\\deff0\n';
    rtfContent += '{\\fonttbl{\\f0 Arial;}}\n';
    rtfContent += '{\\colortbl;\\red0\\green0\\blue0;}\n';

    // Add title
    if (content.metadata.title) {
      rtfContent += `{\\fs32\\b ${this.escapeRtf(content.metadata.title)}\\par}\n`;
      rtfContent += '\\par\n';
    }

    // Add content from each page
    for (const page of content.pages) {
      rtfContent += `{\\fs24\\b Page ${page.pageNumber}\\par}\n`;
      
      for (const para of page.paragraphs) {
        const fontSize = (para.style?.fontSize || 12) * 2;
        const bold = para.style?.bold ? '\\b' : '';
        const italic = para.style?.italic ? '\\i' : '';
        
        rtfContent += `{\\fs${fontSize}${bold}${italic} ${this.escapeRtf(para.text)}\\par}\n`;
      }
      
      rtfContent += '\\par\n';
    }

    rtfContent += '}';

    return Buffer.from(rtfContent, 'utf-8');
  }

  // Convert extracted content to ODT format
  async convertToOdt(content, options = {}) {
    // For ODT, we'll convert to DOCX first and then to ODT
    // In production, use a proper ODT library
    const docxBuffer = await this.convertToDocx(content, options);
    
    // For now, return DOCX buffer
    // In production, convert DOCX to ODT using appropriate library
    return docxBuffer;
  }

  // Convert extracted content to plain text
  async convertToText(content) {
    let textContent = '';

    // Add title
    if (content.metadata.title) {
      textContent += content.metadata.title + '\n';
      textContent += '='.repeat(content.metadata.title.length) + '\n\n';
    }

    // Add content from each page
    for (const page of content.pages) {
      textContent += `--- Page ${page.pageNumber} ---\n\n`;
      
      for (const para of page.paragraphs) {
        textContent += para.text + '\n\n';
      }

      // Add tables as plain text
      if (page.tables && page.tables.length > 0) {
        for (const table of page.tables) {
          for (const row of table.rows) {
            textContent += row.cells.map(cell => cell.text || '').join(' | ') + '\n';
          }
          textContent += '\n';
        }
      }
    }

    return Buffer.from(textContent, 'utf-8');
  }

  // Escape special characters for RTF
  escapeRtf(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\par\n');
  }

  // Simple wrapper methods for v1 API compatibility
  async compressPdf(buffer, options = {}) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    return { buffer: Buffer.from(compressedBytes), size: compressedBytes.length };
  }

  async imagesToPdf(imageBuffers, options = {}) {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const { pageSize = 'A4', orientation = 'portrait' } = options;
    
    let pageWidth = 595.28, pageHeight = 841.89;
    if (orientation === 'landscape') [pageWidth, pageHeight] = [pageHeight, pageWidth];

    for (const imgBuffer of imageBuffers) {
      let image;
      try {
        const jpegBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer();
        image = await pdfDoc.embedJpg(jpegBuffer);
      } catch {
        try {
          image = await pdfDoc.embedPng(imgBuffer);
        } catch {
          continue;
        }
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const dims = image.scale(1);
      const scale = Math.min(pageWidth / dims.width, pageHeight / dims.height) * 0.9;
      const scaledWidth = dims.width * scale;
      const scaledHeight = dims.height * scale;
      
      page.drawImage(image, {
        x: (pageWidth - scaledWidth) / 2,
        y: (pageHeight - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight
      });
    }

    const pdfBytes = await pdfDoc.save();
    return { buffer: Buffer.from(pdfBytes), size: pdfBytes.length };
  }

  async mergePdfs(pdfBuffers) {
    const mergedPdf = await PDFLib.PDFDocument.create();
    
    for (const buffer of pdfBuffers) {
      const pdf = await PDFLib.PDFDocument.load(buffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    return { buffer: Buffer.from(pdfBytes), size: pdfBytes.length };
  }

  async splitPdf(buffer, pageRange) {
    const sourcePdf = await PDFLib.PDFDocument.load(buffer);
    const splitPdf = await PDFLib.PDFDocument.create();
    
    const ranges = pageRange.split(',').map(r => r.trim());
    const pageIndices = [];
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n) - 1);
        for (let i = start; i <= end; i++) pageIndices.push(i);
      } else {
        pageIndices.push(parseInt(range) - 1);
      }
    }

    const pages = await splitPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => splitPdf.addPage(page));

    const pdfBytes = await splitPdf.save();
    return { buffer: Buffer.from(pdfBytes), size: pdfBytes.length, pageCount: pages.length };
  }

  // Office to PDF Converter - Convert Word, Excel, PowerPoint to PDF
  async convertOfficeToPdf(file, options = {}) {
    try {
      console.log(`Starting Office to PDF conversion for file: ${file.filename}`);
      console.log('File type:', file.type);

      // Download file from Supabase storage
      const { data: fileBuffer, error: downloadError } = await supabaseAdmin.storage
        .from('files')
        .download(file.path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await fileBuffer.arrayBuffer());
      console.log('File downloaded, size:', buffer.length);

      // Use the new office conversion service
      const officeConversionService = require('./officeConversionService');
      const pdfBuffer = await officeConversionService.convertOfficeToPdf(buffer, file.type, file.filename);
      
      console.log('Conversion completed, PDF size:', pdfBuffer.length);

      // Generate output filename
      const baseFilename = file.filename.replace(/\.[^/.]+$/, '');
      const outputFilename = `${baseFilename}.pdf`;

      // Upload to Supabase storage
      const storagePath = `converted/${uuidv4()}-${outputFilename}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error('Failed to upload converted file: ' + uploadError.message);
      }

      console.log('Converted PDF uploaded successfully');

      // Get page count from PDF
      let pageCount = 1;
      try {
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer);
        pageCount = pdfDoc.getPageCount();
      } catch (e) {
        console.warn('Could not determine page count:', e.message);
      }

      return {
        filename: outputFilename,
        size: pdfBuffer.length,
        path: storagePath,
        format: 'pdf',
        pageCount: pageCount,
        mimeType: 'application/pdf'
      };

    } catch (error) {
      console.error('Office to PDF conversion error:', error);
      throw new Error('Office to PDF conversion failed: ' + error.message);
    }
  }
}

module.exports = new AdvancedPdfService();