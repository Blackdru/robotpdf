# PDF to Word Conversion - Enhanced vs Basic

## Overview

Your RobotPDF application now supports **two modes** of PDF to Word conversion:

### 1. Enhanced Conversion (Recommended) ⭐
- **Format preservation**: Fonts, colors, sizes, bold, italic
- **Tables**: Structure, borders, cell formatting preserved
- **Images**: Extracted and embedded in Word document
- **Layout**: Text alignment, indentation, spacing maintained
- **Lists**: Bullet points and numbering preserved
- **Hyperlinks**: Clickable links maintained
- **Multi-column**: Column layouts preserved

**Requirements**: Python 3.7+ with `pdf2docx` and `pdfplumber` packages

### 2. Basic Conversion (Fallback)
- **Text extraction only**: Plain text from PDF
- **Simple paragraphs**: No formatting preserved
- **No images or tables**: Only text content
- **Always available**: No additional dependencies

## Quick Setup

### Windows
```bash
cd backend
install-python-deps.bat
```

### Linux/macOS
```bash
cd backend
chmod +x install-python-deps.sh
./install-python-deps.sh
```

## How It Works

```
User uploads PDF → Backend receives file
                    ↓
            Check Python availability
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   Python Available        Python Not Available
        ↓                       ↓
Enhanced Conversion      Basic Conversion
(pdf2docx library)      (text extraction)
        ↓                       ↓
   Format Preserved        Plain Text Only
        ↓                       ↓
    Download DOCX          Download DOCX
```

## Testing

1. **Without Python packages** (Basic mode):
   - Upload a formatted PDF
   - Convert to Word
   - Result: Plain text paragraphs only

2. **With Python packages** (Enhanced mode):
   - Run installation script
   - Upload the same PDF
   - Convert to Word
   - Result: Format