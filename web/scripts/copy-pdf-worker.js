#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const sourceFile = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const targetFile = path.join(__dirname, '..', 'public', 'pdf.worker.min.js');
const targetDir = path.dirname(targetFile);

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy the worker file
try {
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('✅ PDF.js worker file copied successfully');
  } else {
    console.warn('⚠️  PDF.js worker source file not found:', sourceFile);
  }
} catch (error) {
  console.error('❌ Failed to copy PDF.js worker file:', error.message);
  process.exit(1);
}