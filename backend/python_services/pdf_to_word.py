#!/usr/bin/env python3
"""
PDF to Word Converter using pdf2docx library
Preserves exact formatting, layout, images, tables from PDF
"""

import sys
import json
import os
import tempfile
import traceback

def convert_pdf_to_word(input_path, output_path, options=None):
    """
    Convert PDF to Word document with exact format preservation
    
    Args:
        input_path: Path to input PDF file
        output_path: Path to output DOCX file
        options: Dictionary of conversion options
    
    Returns:
        Dictionary with conversion result
    """
    try:
        from pdf2docx import Converter
        
        options = options or {}
        
        # Create converter instance
        cv = Converter(input_path)
        
        # Get page range if specified
        start_page = options.get('start_page', 0)
        end_page = options.get('end_page', None)
        
        # Convert with format preservation
        cv.convert(
            output_path,
            start=start_page,
            end=end_page
        )
        
        # Close converter
        cv.close()
        
        # Get file info
        output_size = os.path.getsize(output_path)
        
        return {
            'success': True,
            'output_path': output_path,
            'output_size': output_size,
            'message': 'PDF converted to Word successfully with format preservation'
        }
        
    except ImportError as e:
        return {
            'success': False,
            'error': 'pdf2docx library not installed. Run: pip install pdf2docx',
            'details': str(e)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

def main():
    """Main entry point for command line usage"""
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python pdf_to_word.py <input_pdf> <output_docx> [options_json]'
        }))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Parse options if provided
    options = {}
    if len(sys.argv) > 3:
        try:
            options = json.loads(sys.argv[3])
        except json.JSONDecodeError:
            pass
    
    # Validate input file exists
    if not os.path.exists(input_path):
        print(json.dumps({
            'success': False,
            'error': f'Input file not found: {input_path}'
        }))
        sys.exit(1)
    
    # Perform conversion
    result = convert_pdf_to_word(input_path, output_path, options)
    
    # Output result as JSON
    print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)

if __name__ == '__main__':
    main()
