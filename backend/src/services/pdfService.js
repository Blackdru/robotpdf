const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { supabaseAdmin } = require('../config/supabase');

class PDFService {
  // Helper function to get file buffer from Supabase Storage
  async getFileBuffer(filePath) {
    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  // Helper function to save processed file
  async saveProcessedFile(userId, buffer, filename, mimetype) {
    const filePath = `${userId}/processed/${Date.now()}-${filename}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('files')
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to save processed file: ${uploadError.message}`);
    }

    // Save metadata to database
    const { data: fileData, error: dbError } = await supabaseAdmin
      .from('files')
      .insert([
        {
          user_id: userId,
          filename: filename,
          path: uploadData.path,
          type: mimetype,
          size: buffer.length
        }
      ])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage.from('files').remove([uploadData.path]);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return fileData;
  }

  // Merge PDFs
  async mergePDFs(files, outputName = 'merged.pdf') {
    // Verify all files are PDFs
    const nonPdfFiles = files.filter(file => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      throw new Error('All files must be PDFs for merging');
    }

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const fileBuffer = await this.getFileBuffer(file.path);
      const pdf = await PDFDocument.load(fileBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBuffer = Buffer.from(await mergedPdf.save());

    // Save merged file
    const savedFile = await this.saveProcessedFile(
      files[0].user_id,
      mergedBuffer,
      outputName,
      'application/pdf'
    );

    return savedFile;
  }

  // Split PDF
  async splitPDF(file, pages = null, outputName = 'split.pdf') {
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    const fileBuffer = await this.getFileBuffer(file.path);
    const pdf = await PDFDocument.load(fileBuffer);
    const totalPages = pdf.getPageCount();

    // If no specific pages provided, split into individual pages
    if (!pages || !Array.isArray(pages)) {
      const splitFiles = [];

      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);

        const splitBuffer = Buffer.from(await newPdf.save());
        const savedFile = await this.saveProcessedFile(
          file.user_id,
          splitBuffer,
          `${outputName.replace('.pdf', '')}_page_${i + 1}.pdf`,
          'application/pdf'
        );

        splitFiles.push(savedFile);
      }

      return splitFiles;
    }

    // Split specific pages
    const validPages = pages.filter(p => p >= 1 && p <= totalPages);
    if (validPages.length === 0) {
      throw new Error('No valid page numbers provided');
    }

    const newPdf = await PDFDocument.create();
    const pageIndices = validPages.map(p => p - 1); // Convert to 0-based index
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const splitBuffer = Buffer.from(await newPdf.save());
    const savedFile = await this.saveProcessedFile(
      file.user_id,
      splitBuffer,
      outputName,
      'application/pdf'
    );

    return savedFile;
  }

  // Compress PDF
  async compressPDF(file, quality = 0.5, outputName = 'compressed.pdf') {
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    const fileBuffer = await this.getFileBuffer(file.path);
    const originalSize = fileBuffer.length;
    
    try {
      const pdf = await PDFDocument.load(fileBuffer);

      // Try multiple compression strategies
      let bestCompression = null;
      let bestSize = originalSize;

      // Strategy 1: Basic compression
      try {
        const basicCompressed = Buffer.from(await pdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50,
          updateFieldAppearances: false
        }));

        if (basicCompressed.length < bestSize) {
          bestCompression = basicCompressed;
          bestSize = basicCompressed.length;
        }
      } catch (error) {
        console.warn('Basic compression failed:', error.message);
      }

      // Strategy 2: Aggressive compression
      try {
        const aggressiveCompressed = Buffer.from(await pdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 10,
          updateFieldAppearances: false,
          compress: true
        }));

        if (aggressiveCompressed.length < bestSize) {
          bestCompression = aggressiveCompressed;
          bestSize = aggressiveCompressed.length;
        }
      } catch (error) {
        console.warn('Aggressive compression failed:', error.message);
      }

      // Strategy 3: Minimal compression (fallback)
      if (!bestCompression) {
        try {
          const minimalCompressed = Buffer.from(await pdf.save({
            useObjectStreams: false,
            addDefaultPage: false
          }));

          if (minimalCompressed.length < originalSize) {
            bestCompression = minimalCompressed;
            bestSize = minimalCompressed.length;
          }
        } catch (error) {
          console.warn('Minimal compression failed:', error.message);
        }
      }

      // If no compression worked or didn't reduce size significantly
      if (!bestCompression || bestSize >= originalSize * 0.95) {
        // Calculate compression ratio for display
        const compressionRatio = bestCompression 
          ? ((originalSize - bestSize) / originalSize * 100).toFixed(1)
          : '0.0';
        
        if (parseFloat(compressionRatio) < 5) {
          throw new Error('PDF is already well optimized. Compression would save less than 5% of file size.');
        }
      }

      const compressionRatio = ((originalSize - bestSize) / originalSize * 100).toFixed(1);
      
      const savedFile = await this.saveProcessedFile(
        file.user_id,
        bestCompression,
        outputName,
        'application/pdf'
      );

      // Add compression ratio to the result
      savedFile.compressionRatio = `${compressionRatio}%`;
      savedFile.originalSize = originalSize;
      savedFile.compressedSize = bestSize;

      return savedFile;
    } catch (error) {
      if (error.message.includes('already well optimized') || error.message.includes('already optimized')) {
        throw error;
      }
      console.error('PDF compression error:', error);
      throw new Error('Failed to compress PDF. The file may be corrupted or use unsupported features.');
    }
  }

  // Convert images to PDF
  async convertImagesToPDF(files, outputName = 'converted.pdf') {
    // Verify all files are images
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const nonImageFiles = files.filter(file => !imageTypes.includes(file.type));
    if (nonImageFiles.length > 0) {
      throw new Error('All files must be images (JPEG, JPG, PNG, GIF, WebP)');
    }

    const pdf = await PDFDocument.create();

    for (const file of files) {
      const imageBuffer = await this.getFileBuffer(file.path);
      
      // Process image with sharp to ensure compatibility
      let processedImage;
      let image;
      
      if (file.type === 'image/png') {
        processedImage = await sharp(imageBuffer)
          .png({ quality: 90 })
          .toBuffer();
        image = await pdf.embedPng(processedImage);
      } else {
        processedImage = await sharp(imageBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        image = await pdf.embedJpg(processedImage);
      }

      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const pdfBuffer = Buffer.from(await pdf.save());

    const savedFile = await this.saveProcessedFile(
      files[0].user_id,
      pdfBuffer,
      outputName,
      'application/pdf'
    );

    return savedFile;
  }

  // Get PDF info
  async getPDFInfo(file) {
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    const fileBuffer = await this.getFileBuffer(file.path);
    const pdf = await PDFDocument.load(fileBuffer);

    return {
      pageCount: pdf.getPageCount(),
      title: pdf.getTitle() || 'Untitled',
      author: pdf.getAuthor() || 'Unknown',
      subject: pdf.getSubject() || '',
      creator: pdf.getCreator() || 'Unknown',
      producer: pdf.getProducer() || 'Unknown',
      creationDate: pdf.getCreationDate(),
      modificationDate: pdf.getModificationDate(),
      fileSize: file.size,
      filename: file.filename
    };
  }
}

module.exports = new PDFService();