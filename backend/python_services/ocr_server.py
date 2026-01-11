#!/usr/bin/env python3
"""
Persistent OCR Server using EasyOCR
Pre-loads models at startup for fast OCR processing
Runs as HTTP server on localhost:5050
"""

import sys
import json
import base64
import io
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

print("Starting OCR Server...", file=sys.stderr)

try:
    import easyocr
    print("✓ EasyOCR imported", file=sys.stderr)
except ImportError as e:
    print(f"✗ EasyOCR import failed: {e}", file=sys.stderr)
    sys.exit(1)

try:
    from PIL import Image, ImageEnhance
    import numpy as np
    print("✓ PIL/NumPy imported", file=sys.stderr)
except ImportError as e:
    print(f"✗ PIL/NumPy import failed: {e}", file=sys.stderr)
    sys.exit(1)

try:
    import fitz  # PyMuPDF
    print("✓ PyMuPDF imported", file=sys.stderr)
except ImportError:
    fitz = None
    print("⚠ PyMuPDF not available (PDF OCR disabled)", file=sys.stderr)

# Global readers - pre-loaded at startup
READERS = {}
SUPPORTED_LANGUAGES = {
    'en': 'English', 'hi': 'Hindi', 'te': 'Telugu', 'ta': 'Tamil',
    'kn': 'Kannada', 'ml': 'Malayalam', 'mr': 'Marathi', 'bn': 'Bengali',
    'gu': 'Gujarati', 'pa': 'Punjabi', 'ar': 'Arabic', 'fa': 'Persian',
    'ur': 'Urdu', 'ru': 'Russian', 'de': 'German', 'fr': 'French',
    'es': 'Spanish', 'pt': 'Portuguese', 'it': 'Italian', 'ja': 'Japanese',
    'ko': 'Korean', 'ch_sim': 'Chinese Simplified', 'th': 'Thai', 'vi': 'Vietnamese'
}

def preload_readers():
    """Pre-load common language readers at startup."""
    global READERS
    
    print("Pre-loading OCR readers (this takes 30-60 seconds)...", file=sys.stderr)
    start = time.time()
    
    # Pre-load English + Hindi (most common for Indian documents)
    try:
        print("  Loading English + Hindi reader...", file=sys.stderr)
        READERS['en+hi'] = easyocr.Reader(['en', 'hi'], gpu=False, verbose=False)
        print(f"  ✓ English + Hindi loaded in {time.time()-start:.1f}s", file=sys.stderr)
    except Exception as e:
        print(f"  ✗ Failed to load en+hi: {e}", file=sys.stderr)
    
    # Pre-load English only (fallback)
    try:
        print("  Loading English reader...", file=sys.stderr)
        READERS['en'] = easyocr.Reader(['en'], gpu=False, verbose=False)
        print(f"  ✓ English loaded", file=sys.stderr)
    except Exception as e:
        print(f"  ✗ Failed to load en: {e}", file=sys.stderr)
    
    print(f"✓ OCR readers ready in {time.time()-start:.1f}s", file=sys.stderr)

def get_reader(languages):
    """Get appropriate reader for languages."""
    global READERS
    
    # Normalize languages
    if not languages:
        languages = ['en', 'hi']
    
    # Check for Indian languages - they can only pair with English
    indian_langs = {'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'}
    has_indian = any(l in indian_langs for l in languages)
    
    if has_indian:
        # Use pre-loaded en+hi reader for any Indian language
        if 'en+hi' in READERS:
            return READERS['en+hi']
    
    # Use English reader as fallback
    if 'en' in READERS:
        return READERS['en']
    
    # Create new reader if needed (slow path)
    key = '+'.join(sorted(languages))
    if key not in READERS:
        print(f"Creating new reader for {languages} (slow)...", file=sys.stderr)
        READERS[key] = easyocr.Reader(languages, gpu=False, verbose=False)
    
    return READERS[key]


def enhance_image(image):
    """Enhance image for better OCR."""
    try:
        width, height = image.size
        if width and height:
            if width < 1000 or height < 1000:
                scale = max(1000 / width, 1000 / height)
                new_size = (int(width * scale), int(height * scale))
                image = image.resize(new_size, Image.LANCZOS)
        
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.3)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)
        return image
    except Exception as e:
        print(f"Enhancement error: {e}", file=sys.stderr)
        return image

def process_image(image_data, languages=['en', 'hi'], enhance=True):
    """Process image with EasyOCR."""
    try:
        start = time.time()
        
        # Decode base64
        if isinstance(image_data, str):
            image_bytes = base64.b64decode(image_data)
        else:
            image_bytes = image_data
        
        print(f"Processing image: {len(image_bytes)} bytes", file=sys.stderr)
        
        # Load and prepare image
        image = Image.open(io.BytesIO(image_bytes))
        print(f"Image size: {image.size}, mode: {image.mode}", file=sys.stderr)
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        if enhance:
            image = enhance_image(image)
        
        img_array = np.array(image)
        print(f"Array shape: {img_array.shape}", file=sys.stderr)
        
        # Get reader and process
        reader = get_reader(languages)
        print(f"Running OCR...", file=sys.stderr)
        results = reader.readtext(img_array, detail=1, paragraph=False)
        print(f"OCR returned {len(results)} detections", file=sys.stderr)
        
        # Extract text
        texts = []
        total_conf = 0
        count = 0
        
        for det in results:
            try:
                if len(det) >= 2:
                    # det format: (bbox, text, confidence)
                    text = str(det[1]) if det[1] else ''
                    conf = float(det[2]) if len(det) > 2 and det[2] is not None else 0.8
                    if text.strip():
                        texts.append(text.strip())
                        total_conf += conf
                        count += 1
            except Exception as e:
                print(f"Detection parse error: {e}", file=sys.stderr)
                continue
        
        full_text = '\n'.join(texts)
        avg_conf = total_conf / count if count > 0 else 0
        
        print(f"OCR completed in {time.time()-start:.2f}s: {len(full_text)} chars, {count} words", file=sys.stderr)
        
        return {
            'text': full_text,
            'confidence': avg_conf,
            'word_count': count,
            'engine': 'easyocr',
            'processing_time': round(time.time() - start, 2)
        }
    except Exception as e:
        import traceback
        print(f"OCR error: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return {'error': str(e), 'text': ''}

def process_pdf(pdf_data, languages=['en', 'hi'], enhance=True, max_pages=20):
    """Process PDF with EasyOCR."""
    if not fitz:
        return {'error': 'PyMuPDF not installed', 'text': ''}
    
    try:
        start = time.time()
        
        if isinstance(pdf_data, str):
            pdf_bytes = base64.b64decode(pdf_data)
        else:
            pdf_bytes = pdf_data
        
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        reader = get_reader(languages)
        
        all_text = []
        pages_data = []
        total_conf = 0
        page_count = min(len(doc), max_pages)
        
        for page_num in range(page_count):
            page = doc[page_num]
            
            # Try embedded text first
            embedded = page.get_text().strip()
            if len(embedded) > 50:
                all_text.append(embedded)
                pages_data.append({'page': page_num+1, 'text': embedded, 'confidence': 0.95})
                total_conf += 0.95
                continue
            
            # OCR the page
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            if enhance:
                img = enhance_image(img)
            
            results = reader.readtext(np.array(img), detail=1, paragraph=True)
            
            page_texts = []
            page_conf = 0
            count = 0
            for det in results:
                if len(det) >= 2:
                    text = det[1] if len(det) > 1 else det[0]
                    conf = det[2] if len(det) > 2 else 0.8
                    if isinstance(text, str) and text.strip():
                        page_texts.append(text.strip())
                        page_conf += conf
                        count += 1
            
            page_text = '\n'.join(page_texts)
            avg = page_conf / count if count > 0 else 0
            all_text.append(page_text)
            pages_data.append({'page': page_num+1, 'text': page_text, 'confidence': avg})
            total_conf += avg
        
        doc.close()
        
        full_text = '\n\n'.join(all_text)
        avg_conf = total_conf / page_count if page_count > 0 else 0
        
        print(f"PDF OCR completed in {time.time()-start:.2f}s: {page_count} pages", file=sys.stderr)
        
        return {
            'text': full_text,
            'confidence': avg_conf,
            'page_count': page_count,
            'pages': pages_data,
            'engine': 'easyocr',
            'processing_time': round(time.time() - start, 2)
        }
    except Exception as e:
        print(f"PDF OCR error: {e}", file=sys.stderr)
        return {'error': str(e), 'text': ''}


class OCRHandler(BaseHTTPRequestHandler):
    """HTTP request handler for OCR server."""
    
    def log_message(self, format, *args):
        print(f"[OCR] {args[0]}", file=sys.stderr)
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_GET(self):
        if self.path == '/health':
            self.send_json({
                'status': 'ok',
                'readers': list(READERS.keys()),
                'languages': len(SUPPORTED_LANGUAGES)
            })
        elif self.path == '/languages':
            self.send_json(SUPPORTED_LANGUAGES)
        else:
            self.send_json({'error': 'Not found'}, 404)
    
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            if self.path == '/ocr/image':
                result = process_image(
                    data.get('data', ''),
                    data.get('languages', ['en', 'hi']),
                    data.get('enhance', True)
                )
                self.send_json(result)
            
            elif self.path == '/ocr/pdf':
                result = process_pdf(
                    data.get('data', ''),
                    data.get('languages', ['en', 'hi']),
                    data.get('enhance', True),
                    data.get('max_pages', 20)
                )
                self.send_json(result)
            
            else:
                self.send_json({'error': 'Unknown endpoint'}, 404)
        
        except Exception as e:
            print(f"Request error: {e}", file=sys.stderr)
            self.send_json({'error': str(e)}, 500)


def main():
    port = int(os.environ.get('OCR_SERVER_PORT', 5050))
    
    # Pre-load readers
    preload_readers()
    
    # Start server
    server = HTTPServer(('127.0.0.1', port), OCRHandler)
    print(f"✓ OCR Server running on http://127.0.0.1:{port}", file=sys.stderr)
    print(f"  Endpoints: /health, /languages, /ocr/image, /ocr/pdf", file=sys.stderr)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down OCR server...", file=sys.stderr)
        server.shutdown()


if __name__ == '__main__':
    main()
