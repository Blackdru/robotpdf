@echo off
echo Installing Python dependencies for PDF to Word conversion...
echo.

REM Try pip first
pip install -r requirements.txt
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation successful!
    echo.
    echo Testing pdf2docx installation...
    python -c "import pdf2docx; print('pdf2docx version:', pdf2docx.__version__)"
    goto :end
)

REM Try pip3 if pip failed
pip3 install -r requirements.txt
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation successful!
    echo.
    echo Testing pdf2docx installation...
    python3 -c "import pdf2docx; print('pdf2docx version:', pdf2docx.__version__)"
    goto :end
)

REM Try py -m pip if others failed
py -m pip install -r requirements.txt
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation successful!
    echo.
    echo Testing pdf2docx installation...
    py -c "import pdf2docx; print('pdf2docx version:', pdf2docx.__version__)"
    goto :end
)

echo.
echo ERROR: Could not install dependencies. Please ensure Python and pip are installed.
echo.
echo Manual installation:
echo   1. Install Python from https://www.python.org/downloads/
echo   2. Run: pip install pdf2docx PyMuPDF python-docx python-pptx Pillow
echo.

:end
pause
