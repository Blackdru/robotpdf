// PDF.js Worker Configuration for Vite
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker with local fallback
const configurePDFWorker = () => {
  // Use the correct version that matches our installed pdfjs-dist version
  const packageVersion = '5.4.149' // Should match the version in package.json
  
  const workerUrls = [
    // Use local worker file first (most reliable)
    '/pdf.worker.min.js',
    // Try jsdelivr CDN with correct .mjs extension
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${packageVersion}/build/pdf.worker.min.mjs`,
    // Fallback to unpkg with .mjs extension
    `https://unpkg.com/pdfjs-dist@${packageVersion}/build/pdf.worker.min.mjs`,
    // Try to use from node_modules via Vite's handling
    new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  ]
  
  // Set the primary worker source to local file
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrls[0]

  return pdfjsLib
}

// Initialize the worker configuration
const pdfjs = configurePDFWorker()

export default pdfjs
export { pdfjsLib }