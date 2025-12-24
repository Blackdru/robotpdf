@echo off
REM Advanced OCR Installation Script for Windows
REM Installs EasyOCR, PaddleOCR, and dependencies

echo ========================================
echo Advanced OCR Installation
echo ========================================
echo.

REM Check Python version
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo.
echo Installing core dependencies...
pip install --upgrade pip
pip install numpy>=1.24.0 Pillow>=10.0.0 opencv-python-headless>=4.8.0

echo.
echo Installing EasyOCR (primary OCR engine)...
pip install easyocr>=1.7.0

echo.
echo Installing PaddleOCR (secondary OCR engine for Asian languages)...
pip install paddlepaddle>=2.5.0
pip install paddleocr>=2.7.0

echo.
echo Installing Tesseract Python bindings (fallback)...
pip install pytesseract>=0.3.10

echo.
echo Installing PyMuPDF for PDF processing...
pip install PyMuPDF>=1.23.0

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Testing OCR engines...
python advanced_ocr.py engines

echo.
echo To test OCR on an image:
echo   python advanced_ocr.py extract path/to/image.png eng auto
echo.
echo To test OCR on a PDF:
echo   python advanced_ocr.py extract_pdf path/to/document.pdf eng auto
echo.
pause
