#!/usr/bin/env python3
"""
Excel to PDF and PDF to Excel Converter
Uses openpyxl for Excel handling and reportlab/pdfplumber for PDF operations
"""

import sys
import json
import os
import tempfile
from io import BytesIO

def install_dependencies():
    """Install required packages if not present"""
    import subprocess
    packages = ['openpyxl', 'reportlab', 'pdfplumber', 'tabula-py', 'pandas']
    for package in packages:
        try:
            __import__(package.replace('-', '_').split('[')[0])
        except ImportError:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package, '-q'])

# Try to install dependencies
try:
    install_dependencies()
except:
    pass

import openpyxl
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfgen import canvas

def excel_to_pdf(input_path, output_path, options=None):
    """
    Convert Excel file to PDF with proper formatting
    """
    options = options or {}
    
    try:
        # Load workbook with data_only=True to get calculated values instead of formulas
        wb = openpyxl.load_workbook(input_path, data_only=True)
        
        # Also load with formulas to get formatting
        wb_format = openpyxl.load_workbook(input_path, data_only=False)
        
        # Create PDF
        page_size = landscape(A4) if options.get('orientation') == 'landscape' else A4
        if options.get('orientation') != 'portrait':
            page_size = landscape(A4)  # Default to landscape for spreadsheets
        
        doc = SimpleDocTemplate(
            output_path,
            pagesize=page_size,
            leftMargin=0.5*inch,
            rightMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=14,
            spaceAfter=12
        )
        
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            ws_format = wb_format[sheet_name]
            
            # Add sheet title
            elements.append(Paragraph(f"Sheet: {sheet_name}", title_style))
            elements.append(Spacer(1, 12))
            
            if ws.max_row == 0 or ws.max_column == 0:
                elements.append(Paragraph("(Empty sheet)", styles['Italic']))
                elements.append(PageBreak())
                continue
            
            # Get data with calculated values
            data = []
            max_cols = min(ws.max_column, 15)  # Limit columns
            max_rows = min(ws.max_row, 500)    # Limit rows
            
            for row_idx in range(1, max_rows + 1):
                row_data = []
                for col_idx in range(1, max_cols + 1):
                    cell = ws.cell(row=row_idx, column=col_idx)
                    cell_format = ws_format.cell(row=row_idx, column=col_idx)
                    
                    # Get the display value (calculated result for formulas)
                    value = cell.value
                    if value is None:
                        value = ''
                    elif isinstance(value, (int, float)):
                        # Apply number formatting
                        num_format = cell_format.number_format
                        if num_format and '%' in num_format:
                            value = f"{value * 100:.2f}%"
                        elif num_format and ('$' in num_format or '£' in num_format or '€' in num_format):
                            value = f"${value:.2f}"
                        elif isinstance(value, float):
                            value = f"{value:.2f}" if value != int(value) else str(int(value))
                        else:
                            value = str(value)
                    else:
                        value = str(value)
                    
                    row_data.append(value)
                data.append(row_data)
            
            if not data:
                elements.append(Paragraph("(No data)", styles['Italic']))
                elements.append(PageBreak())
                continue
            
            # Calculate column widths
            page_width = page_size[0] - inch
            col_widths = []
            for col_idx in range(max_cols):
                max_len = 5
                for row in data[:50]:  # Sample first 50 rows
                    if col_idx < len(row):
                        max_len = max(max_len, len(str(row[col_idx])))
                col_widths.append(min(max_len * 6, 150))
            
            # Normalize widths
            total_width = sum(col_widths)
            if total_width > page_width:
                scale = page_width / total_width
                col_widths = [w * scale for w in col_widths]
            
            # Create table
            table = Table(data, colWidths=col_widths, repeatRows=1)
            
            # Style the table
            style_commands = [
                ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.886, 0.910, 0.941)),  # Header bg
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.Color(0.102, 0.212, 0.365)),   # Header text
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.796, 0.835, 0.882)),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.969, 0.973, 0.980)]),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ]
            
            # Right-align numeric columns
            for col_idx in range(max_cols):
                is_numeric = True
                for row in data[1:10]:  # Check first few data rows
                    if col_idx < len(row):
                        val = str(row[col_idx]).strip()
                        if val and not val.replace('.', '').replace('-', '').replace('%', '').replace('$', '').replace(',', '').isdigit():
                            is_numeric = False
                            break
                if is_numeric:
                    style_commands.append(('ALIGN', (col_idx, 1), (col_idx, -1), 'RIGHT'))
            
            table.setStyle(TableStyle(style_commands))
            elements.append(table)
            
            if sheet_name != wb.sheetnames[-1]:
                elements.append(PageBreak())
        
        # Build PDF
        doc.build(elements)
        
        return {'success': True, 'output': output_path}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def pdf_to_excel(input_path, output_path, options=None):
    """
    Convert PDF to Excel - extracts ALL content (text AND tables)
    """
    options = options or {}
    
    try:
        import pdfplumber
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Converted Data"
        
        # Add metadata
        ws['A1'] = f"Converted from PDF"
        ws['A1'].font = openpyxl.styles.Font(italic=True, color='666666')
        ws['A2'] = f"Date: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}"
        ws['A2'].font = openpyxl.styles.Font(italic=True, color='666666')
        
        current_row = 4
        
        with pdfplumber.open(input_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                # Add page header
                ws.cell(row=current_row, column=1, value=f"--- Page {page_num} ---")
                ws.cell(row=current_row, column=1).font = openpyxl.styles.Font(bold=True, color='1A365D')
                current_row += 1
                
                # Extract ALL text from the page first
                text = page.extract_text()
                
                # Try to extract tables
                tables = page.extract_tables()
                
                # Get table bounding boxes to identify which text is in tables
                table_bboxes = []
                if tables:
                    for t in page.find_tables():
                        if t.bbox:
                            table_bboxes.append(t.bbox)
                
                # If we have text, process it
                if text:
                    lines = text.split('\n')
                    
                    # Track if we're currently in a table region
                    table_idx = 0
                    lines_in_tables = set()
                    
                    # First, add all non-table text
                    for line_num, line in enumerate(lines):
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Check if this line might be part of a table
                        # (Simple heuristic: lines with multiple tab/space separations)
                        is_table_line = False
                        if tables:
                            # Check if line has table-like structure
                            parts = line.split()
                            if len(parts) >= 3:
                                # Could be table data - check against extracted tables
                                for table in tables:
                                    for row in table:
                                        if row:
                                            row_text = ' '.join([str(c) for c in row if c])
                                            if line in row_text or row_text in line:
                                                is_table_line = True
                                                lines_in_tables.add(line_num)
                                                break
                                    if is_table_line:
                                        break
                        
                        if not is_table_line:
                            # Regular text line - add to Excel
                            ws.cell(row=current_row, column=1, value=line)
                            current_row += 1
                    
                    current_row += 1  # Space after text
                
                # Now add tables with formatting
                if tables:
                    for table_idx, table in enumerate(tables):
                        if not table:
                            continue
                        
                        # Add table header indicator
                        ws.cell(row=current_row, column=1, value=f"[Table {table_idx + 1}]")
                        ws.cell(row=current_row, column=1).font = openpyxl.styles.Font(bold=True, italic=True, color='4A5568')
                        current_row += 1
                        
                        # Write table data
                        for row_idx, row in enumerate(table):
                            if not row:
                                continue
                            for col_idx, cell in enumerate(row):
                                cell_value = cell if cell else ''
                                # Clean up cell value
                                if isinstance(cell_value, str):
                                    cell_value = cell_value.strip()
                                
                                excel_cell = ws.cell(row=current_row, column=col_idx + 1, value=cell_value)
                                
                                # Style first row as header
                                if row_idx == 0:
                                    excel_cell.font = openpyxl.styles.Font(bold=True)
                                    excel_cell.fill = openpyxl.styles.PatternFill(
                                        start_color='E2E8F0',
                                        end_color='E2E8F0',
                                        fill_type='solid'
                                    )
                                
                                # Add borders
                                excel_cell.border = openpyxl.styles.Border(
                                    left=openpyxl.styles.Side(style='thin', color='CBD5E1'),
                                    right=openpyxl.styles.Side(style='thin', color='CBD5E1'),
                                    top=openpyxl.styles.Side(style='thin', color='CBD5E1'),
                                    bottom=openpyxl.styles.Side(style='thin', color='CBD5E1')
                                )
                            
                            current_row += 1
                        
                        current_row += 1  # Space between tables
                
                # If no text and no tables, note that
                if not text and not tables:
                    ws.cell(row=current_row, column=1, value="(No extractable content on this page)")
                    ws.cell(row=current_row, column=1).font = openpyxl.styles.Font(italic=True, color='999999')
                    current_row += 1
                
                current_row += 1  # Space between pages
        
        # Auto-fit columns
        for column in ws.columns:
            max_length = 0
            column_letter = get_column_letter(column[0].column)
            for cell in column:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            ws.column_dimensions[column_letter].width = min(max_length + 2, 60)
        
        wb.save(output_path)
        
        return {'success': True, 'output': output_path}
        
    except Exception as e:
        import traceback
        return {'success': False, 'error': f"{str(e)}\n{traceback.format_exc()}"}


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({'success': False, 'error': 'Usage: python excel_pdf_converter.py <mode> <input> <output> [options_json]'}))
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
    
    print(json.dumps(result))
