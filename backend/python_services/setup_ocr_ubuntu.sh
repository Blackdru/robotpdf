#!/bin/bash
# EasyOCR Setup Script for Ubuntu EC2 (t4g.medium - ARM64/Graviton)
# Run: chmod +x setup_ocr_ubuntu.sh && ./setup_ocr_ubuntu.sh

set -e

echo "=========================================="
echo "EasyOCR Setup for Ubuntu ARM64 (Graviton)"
echo "=========================================="

# Update system
echo "Updating system packages..."
sudo apt-get update -y

# Install Python and pip if not present
echo "Installing Python dependencies..."
sudo apt-get install -y python3 python3-pip python3-venv python3-dev

# Install system dependencies for image processing
echo "Installing system libraries..."
sudo apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libopenblas-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev

# Install poppler for PDF processing
echo "Installing PDF tools..."
sudo apt-get install -y poppler-utils

# Create virtual environment if it doesn't exist
VENV_PATH="/home/ubuntu/pdf-venv"
if [ ! -d "$VENV_PATH" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv $VENV_PATH
fi

# Activate virtual environment
source $VENV_PATH/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip wheel setuptools

# Install PyTorch CPU version for ARM64 (required by EasyOCR)
echo "Installing PyTorch for ARM64..."
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install EasyOCR and dependencies
echo "Installing EasyOCR and OCR dependencies..."
pip install \
    easyocr>=1.7.0 \
    Pillow>=10.0.0 \
    numpy>=1.24.0 \
    opencv-python-headless>=4.8.0 \
    PyMuPDF>=1.23.0

# Install other PDF processing dependencies
echo "Installing PDF processing libraries..."
pip install \
    pdf2docx>=0.5.6 \
    python-docx>=0.8.11 \
    reportlab>=4.0.0 \
    openpyxl>=3.1.0 \
    pdfplumber>=0.10.0 \
    pandas>=2.0.0 \
    python-pptx>=0.6.21

# Test EasyOCR installation
echo "Testing EasyOCR installation..."
python3 -c "import easyocr; print('EasyOCR version:', easyocr.__version__)"

# Pre-download common language models (English + Hindi)
echo "Pre-downloading language models (this may take a few minutes)..."
python3 -c "
import easyocr
print('Downloading English + Hindi models...')
reader = easyocr.Reader(['en', 'hi'], gpu=False, verbose=True)
print('Models downloaded successfully!')
"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Virtual environment: $VENV_PATH"
echo "Activate with: source $VENV_PATH/bin/activate"
echo ""
echo "Add to your .env file:"
echo "PYTHON_PATH=$VENV_PATH/bin/python3"
echo ""
