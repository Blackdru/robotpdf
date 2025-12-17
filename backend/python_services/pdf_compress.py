#!/usr/bin/env python3
"""
PDF Compression Service using Ghostscript
Provides real compression by downsampling images and optimizing PDF structure
"""

import sys
import subprocess
import tempfile
import os
import shutil

def compress_pdf(input_path, output_path, quality='medium'):
    """
    Compress PDF using Ghostscript
    
    Quality levels:
    - 'low': Aggressive compression, smaller file, lower quality (screen)
    - 'medium': Balanced compression (ebook) - default
    - 'high': Light compression, larger file, better quality (printer)
    """
    
    # Map quality to Ghostscript settings
    quality_settings = {
        'low': '/screen',      # 72 dpi images
        'medium': '/ebook',    # 150 dpi images  
        'high': '/printer',    # 300 dpi images
        'prepress': '/prepress' # 300 dpi, color preserving
    }
    
    gs_quality = quality_settings.get(quality, '/ebook')
    
    # Find Ghostscript executable
    gs_cmd = None
    if sys.platform == 'win32':
        # Windows: try common installation paths
        possible_paths = [
            'gswin64c',
            'gswin32c', 
            r'C:\Program Files\gs\gs10.02.1\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.01.2\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs10.00.0\bin\gswin64c.exe',
            r'C:\Program Files\gs\gs9.56.1\bin\gswin64c.exe',
            r'C:\Program Files (x86)\gs\gs10.02.1\bin\gswin32c.exe',
        ]
        for path in possible_paths:
            if shutil.which(path) or os.path.exists(path):
                gs_cmd = path
                break
    else:
        # Linux/Mac
        gs_cmd = shutil.which('gs') or shutil.which('ghostscript')
    
    if not gs_cmd:
        raise Exception('Ghostscript not found. Please install Ghostscript for PDF compression.')
    
    # Build Ghostscript command
    cmd = [
        gs_cmd,
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        f'-dPDFSETTINGS={gs_quality}',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dDetectDuplicateImages=true',
        '-dCompressFonts=true',
        '-dSubsetFonts=true',
        '-dColorImageDownsampleType=/Bicubic',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dMonoImageDownsampleType=/Bicubic',
        f'-sOutputFile={output_path}',
        input_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or 'Unknown Ghostscript error'
            raise Exception(f'Ghostscript compression failed: {error_msg}')
        
        # Check if output file was created and is smaller
        if not os.path.exists(output_path):
            raise Exception('Compressed file was not created')
        
        input_size = os.path.getsize(input_path)
        output_size = os.path.getsize(output_path)
        
        return {
            'success': True,
            'input_size': input_size,
            'output_size': output_size,
            'compression_ratio': round((1 - output_size / input_size) * 100, 1) if input_size > 0 else 0
        }
        
    except subprocess.TimeoutExpired:
        raise Exception('PDF compression timed out')
    except Exception as e:
        raise Exception(f'Compression error: {str(e)}')


def main():
    if len(sys.argv) < 3:
        print('Usage: python pdf_compress.py <input_path> <output_path> [quality]', file=sys.stderr)
        print('Quality: low, medium (default), high', file=sys.stderr)
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    quality = sys.argv[3] if len(sys.argv) > 3 else 'medium'
    
    if not os.path.exists(input_path):
        print(f'Error: Input file not found: {input_path}', file=sys.stderr)
        sys.exit(1)
    
    try:
        result = compress_pdf(input_path, output_path, quality)
        print(f"Compression successful!")
        print(f"Input size: {result['input_size']} bytes")
        print(f"Output size: {result['output_size']} bytes")
        print(f"Compression ratio: {result['compression_ratio']}%")
        sys.exit(0)
    except Exception as e:
        print(f'Error: {str(e)}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
