#!/usr/bin/env python3
"""
Wrapper script to catch and report any errors from excel_pdf_converter.py
"""
import sys
import json
import traceback

try:
    # Import and run the main converter
    from excel_pdf_converter import excel_to_pdf, pdf_to_excel
    
    if len(sys.argv) < 4:
        print(json.dumps({'success': False, 'error': 'Usage: python excel_pdf_converter.py <mode> <input> <output> [options_json]'}), flush=True)
        sys.exit(1)
    
    mode = sys.argv[1]
    input_path = sys.argv[2]
    output_path = sys.argv[3]
    options = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
    
    if mode == 'excel-to-pdf':
        result = excel_to_pdf(input_path, output_path, options)
    elif mode == 'pdf-to-excel':
        result = pdf_to_excel(input_path, output_path, options)
    else:
        result = {'success': False, 'error': f'Unknown mode: {mode}'}
    
    print(json.dumps(result), flush=True)
    sys.exit(0 if result.get('success') else 1)
    
except Exception as e:
    error_result = {
        'success': False,
        'error': f'Wrapper caught error: {str(e)}',
        'traceback': traceback.format_exc()
    }
    print(json.dumps(error_result), flush=True)
    sys.exit(1)
