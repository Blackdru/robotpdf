#!/bin/bash
# Advanced OCR Installation Script for Linux/Mac
# Installs EasyOCR, PaddleOCR, and dependencies

echo "========================================"
echo "Advanced OCR Installation"
echo "========================================"
echo

# Check Python version
python3 --version
if [ $? -ne 0 ]; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ first"
    exit 1
fi

echo
echo "Installing core dependencies..."
pip3 install --upgrade pip
pip3 install numpy>=1.24.0 Pillow>=10.0.0 opencv-python-headless>=4.8.0

echo
echo "Installing EasyOCR (primary OCR engine)..."
pip3 install easyocr>=1.7.0

echo
echo "Installing PaddleOCR (secondary OCR engine for Asian languages)..."
pip3 install paddlepaddle>=2.5.0
pip3 install paddleocr>=2.7.0

echo
echo "Installing Tesseract Python bindings (fallback)..."
pip3 install pytesseract>=0.3.10

# Install Tesseract system package if not present
if ! command -v tesseract &> /dev/null; then
    echo
    echo "Installing Tesseract OCR system package..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install tesseract tesseract-lang
    elif [[ -f /etc/debian_version ]]; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y tesseract-ocr tesseract-ocr-all
    elif [[ -f /etc/redhat-release ]]; then
        # RHEL/CentOS/Fedora
        sudo dnf install -y tesseract tesseract-langpack-*
    fi
fi

echo
echo "Installing PyMuPDF for PDF processing..."
pip3 install PyMuPDF>=1.23.0

echo
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo
echo "Testing OCR engines..."
python3 advanced_ocr.py engines

echo
echo "To test OCR on an image:"
echo "  python3 advanced_ocr.py extract path/to/image.png eng auto"
echo
echo "To test OCR on a PDF:"
echo "  python3 advanced_ocr.py extract_pdf path/to/document.pdf eng auto"
echo
