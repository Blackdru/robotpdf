import { createWorker } from 'tesseract.js'
import pdfjs from './pdfWorker.js'

// Use the configured PDF.js instance
const pdfjsLib = pdfjs

class OCRService {
  constructor() {
    this.worker = null
    this.isInitialized = false
    this.currentLanguage = 'eng'
  }

  async initialize(language = 'eng') {
    if (this.isInitialized && this.currentLanguage === language) return

    try {
      // Terminate existing worker if language changed
      if (this.worker && this.currentLanguage !== language) {
        try {
          await this.worker.terminate()
        } catch (terminateError) {
          
        }
        this.worker = null
        this.isInitialized = false
      }

      if (!this.worker) {

        this.worker = await createWorker(language, 1, {
          logger: m => {
            if (m.status === 'loading tesseract core') {
              
            } else if (m.status === 'initializing tesseract') {
              
            } else if (m.status === 'loading language traineddata') {
              
            }
          }
        })
        
        // Set parameters only during initialization
        try {
          await this.worker.setParameters({
            tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
            tessedit_char_whitelist: '', // Allow all characters
          })
        } catch (paramError) {
          
        }

      }
      
      this.isInitialized = true
      this.currentLanguage = language
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error)
      this.isInitialized = false
      this.worker = null
      throw new Error('OCR initialization failed: ' + error.message)
    }
  }

  async recognizeText(imageData, options = {}) {
    const {
      language = 'eng',
      enhanceImage = true,
      psm = '1',
      oem = '3',
      onProgress = null
    } = options

    try {
      await this.initialize(language)

      if (!this.worker || !this.isInitialized) {
        throw new Error('OCR worker not properly initialized')
      }

      // Only set parameters that are safe to set after initialization
      try {
        await this.worker.setParameters({
          tessedit_pageseg_mode: psm,
        })
      } catch (paramError) {
        
      }

      // Simulate progress updates since we can't use logger
      if (onProgress) {
        onProgress(0.1)
        setTimeout(() => onProgress(0.3), 100)
        setTimeout(() => onProgress(0.6), 500)
        setTimeout(() => onProgress(0.8), 1000)
      }
      
      // Perform OCR without logger to avoid DataCloneError
      const { data } = await this.worker.recognize(imageData)

      // Report completion
      if (onProgress) {
        onProgress(1.0)
      }

      return {
        text: data.text || '',
        confidence: (data.confidence || 0) / 100,
        words: data.words?.map(word => ({
          text: word.text,
          confidence: (word.confidence || 0) / 100,
          bbox: word.bbox
        })) || [],
        lines: data.lines?.map(line => ({
          text: line.text,
          confidence: (line.confidence || 0) / 100,
          bbox: line.bbox
        })) || [],
        paragraphs: data.paragraphs?.map(paragraph => ({
          text: paragraph.text,
          confidence: (paragraph.confidence || 0) / 100,
          bbox: paragraph.bbox
        })) || [],
        blocks: data.blocks?.map(block => ({
          text: block.text,
          confidence: (block.confidence || 0) / 100,
          bbox: block.bbox
        })) || []
      }
    } catch (error) {
      console.error('OCR recognition failed:', error)
      throw new Error('Text recognition failed: ' + error.message)
    }
  }

  async recognizeFromPDF(pdfFile, options = {}) {
    try {
      const {
        language = 'eng',
        maxPages = 10, // Limit pages for basic version
        onProgress = null,
        isPro = false
      } = options

      // Convert PDF file to ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(pdfFile)
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const totalPages = pdf.numPages
      
      // Limit pages for basic version
      const pagesToProcess = isPro ? totalPages : Math.min(maxPages, totalPages)
      
      const results = []
      let totalProgress = 0

      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          // Get page
          const page = await pdf.getPage(pageNum)
          
          // Set up canvas for rendering
          const scale = 2.0 // Higher scale for better OCR accuracy
          const viewport = page.getViewport({ scale })
          
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise

          // Convert canvas to blob
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png')
          })

          // Perform OCR on the page image
          const pageProgress = (progress) => {
            const overallProgress = ((pageNum - 1) / pagesToProcess) + (progress / pagesToProcess)
            if (onProgress) onProgress(overallProgress)
          }

          const result = await this.recognizeText(blob, {
            language,
            onProgress: pageProgress
          })

          results.push({
            pageNumber: pageNum,
            ...result
          })

          totalProgress = pageNum / pagesToProcess
          if (onProgress) onProgress(totalProgress)

        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError)
          results.push({
            pageNumber: pageNum,
            text: '',
            confidence: 0,
            error: pageError.message
          })
        }
      }

      // Calculate overall statistics
      const validResults = results.filter(r => !r.error)
      const fullText = validResults.map(r => r.text).join('\n\n')
      const averageConfidence = validResults.length > 0 
        ? validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length 
        : 0

      return {
        pages: results,
        fullText,
        averageConfidence,
        pageCount: results.length,
        totalPages,
        processedPages: pagesToProcess,
        isLimited: !isPro && totalPages > maxPages
      }
    } catch (error) {
      console.error('PDF OCR failed:', error)
      throw new Error('PDF text extraction failed: ' + error.message)
    }
  }

  async recognizeFromImage(imageFile, options = {}) {
    try {
      const {
        language = 'eng',
        onProgress = null
      } = options

      // Convert image file to blob if needed
      const imageBlob = imageFile instanceof Blob ? imageFile : await this.fileToBlob(imageFile)
      
      const result = await this.recognizeText(imageBlob, {
        language,
        onProgress
      })

      return {
        pages: [{
          pageNumber: 1,
          ...result
        }],
        fullText: result.text,
        averageConfidence: result.confidence,
        pageCount: 1,
        totalPages: 1,
        processedPages: 1,
        isLimited: false
      }
    } catch (error) {
      console.error('Image OCR failed:', error)
      throw new Error('Image text extraction failed: ' + error.message)
    }
  }

  async recognizeFromFile(file, options = {}) {
    const fileType = file.type || this.getFileTypeFromName(file.name)
    
    if (fileType === 'application/pdf') {
      return await this.recognizeFromPDF(file, options)
    } else if (fileType.startsWith('image/')) {
      return await this.recognizeFromImage(file, options)
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or image file.')
    }
  }

  getFileTypeFromName(filename) {
    const extension = filename.split('.').pop().toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']
    
    if (extension === 'pdf') return 'application/pdf'
    if (imageExtensions.includes(extension)) return `image/${extension}`
    
    return 'unknown'
  }

  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  async fileToBlob(file) {
    if (file instanceof Blob) return file
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const blob = new Blob([e.target.result], { type: file.type })
        resolve(blob)
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  async enhanceImage(imageData) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Apply basic enhancement (increase contrast and brightness)
        for (let i = 0; i < data.length; i += 4) {
          // Increase contrast and brightness
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128 + 10))     // Red
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128 + 10)) // Green
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128 + 10)) // Blue
        }
        
        // Put enhanced image data back
        ctx.putImageData(imageData, 0, 0)
        
        // Convert to blob
        canvas.toBlob(resolve, 'image/png')
      }
      
      if (imageData instanceof Blob) {
        img.src = URL.createObjectURL(imageData)
      } else {
        img.src = imageData
      }
    })
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }

  getSupportedLanguages() {
    return [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' },
      { code: 'chi_tra', name: 'Chinese (Traditional)' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' },
      { code: 'tha', name: 'Thai' },
      { code: 'vie', name: 'Vietnamese' },
      { code: 'nld', name: 'Dutch' },
      { code: 'pol', name: 'Polish' },
      { code: 'swe', name: 'Swedish' },
      { code: 'nor', name: 'Norwegian' },
      { code: 'dan', name: 'Danish' }
    ]
  }
}

// Create singleton instance
export const ocrService = new OCRService()
export default ocrService