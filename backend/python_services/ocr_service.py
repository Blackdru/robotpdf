#!/usr/bin/env python3
"""
Multi-Language OCR Service using EasyOCR
Supports 80+ languages with on-demand model downloading
"""

import sys
import json
import base64
import io
import os
import tempfile
from pathlib import Path

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

# EasyOCR supported languages (80+ languages)
SUPPORTED_LANGUAGES = {
    # Latin Script
    'en': 'English', 'fr': 'French', 'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese',
    'it': 'Italian', 'nl': 'Dutch', 'pl': 'Polish', 'ro': 'Romanian', 'hu': 'Hungarian',
    'cs': 'Czech', 'sk': 'Slovak', 'hr': 'Croatian', 'sl': 'Slovenian', 'sq': 'Albanian',
    'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 'fi': 'Finnish', 'et': 'Estonian',
    'lv': 'Latvian', 'lt': 'Lithuanian', 'is': 'Icelandic', 'ga': 'Irish', 'cy': 'Welsh',
    'eu': 'Basque', 'ca': 'Catalan', 'gl': 'Galician', 'mt': 'Maltese', 'tr': 'Turkish',
    'az': 'Azerbaijani', 'uz': 'Uzbek', 'id': 'Indonesian', 'ms': 'Malay', 'tl': 'Filipino',
    'vi': 'Vietnamese', 'af': 'Afrikaans', 'sw': 'Swahili',
    
    # Cyrillic Script
    'ru': 'Russian', 'uk': 'Ukrainian', 'be': 'Belarusian', 'bg': 'Bulgarian',
    'sr': 'Serbian (Cyrillic)', 'mk': 'Macedonian', 'mn': 'Mongolian',
    
    # Arabic Script
    'ar': 'Arabic', 'fa': 'Persian/Farsi', 'ur': 'Urdu',
    
    # Devanagari & Indian Scripts
    'hi': 'Hindi', 'mr': 'Marathi', 'ne': 'Nepali', 'sa': 'Sanskrit',
    'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada', 'ml': 'Malayalam',
    'bn': 'Bengali', 'as': 'Assamese', 'gu': 'Gujarati', 'pa': 'Punjabi', 'or': 'Odia',
    
    # East Asian
    'ch_sim': 'Chinese (Simplified)', 'ch_tra': 'Chinese (Traditional)',
    'ja': 'Japanese', 'ko': 'Korean',
    
    # Southeast Asian
    'th': 'Thai', 'my': 'Myanmar', 'km': 'Khmer', 'lo': 'Lao',
    
    # Other Scripts
    'el': 'Greek', 'he': 'Hebrew', 'ka': 'Georgian', 'hy': 'Armenian',
}

# Language code mapping (Tesseract to EasyOCR)
LANG_MAP = {
    'eng': 'en', 'hin': 'hi', 'tel': 'te', 'tam': 'ta', 'kan': 'kn', 'mal': 'ml',
    'mar': 'mr', 'ben': 'bn', 'guj': 'gu', 'pan': 'pa', 'ori': 'or', 'asm': 'as',
    'nep': 'ne', 'san': 'sa', 'urd': 'ur',
    'ara': 'ar', 'fas': 'fa', 'heb': 'he',
    'chi_sim': 'ch_sim', 'chi_tra': 'ch_tra', 'jpn': 'ja', 'kor': 'ko',
    'vie': 'vi', 'tha': 'th', 'mya': 'my', 'khm': 'km', 'lao': 'lo',
    'rus': 'ru', 'ukr': 'uk', 'bel': 'be', 'bul': 'bg', 'srp': 'sr', 'mkd': 'mk',
    'deu': 'de', 'fra': 'fr', 'spa': 'es', 'por': 'pt', 'ita': 'it', 'nld': 'nl',
    'pol': 'pl', 'ces': 'cs', 'slk': 'sk', 'ron': 'ro', 'hun': 'hu',
    'dan': 'da', 'nor': 'no', 'swe': 'sv', 'fin': 'fi',
    'ell': 'el', 'tur': 'tr', 'ind': 'id', 'msa': 'ms', 'fil': 'tl',
    'kat': 'ka', 'hye': 'hy', 'mon': 'mn',
}

# Cached reader instances
_readers = {}

def get_reader(languages):
    """Get or create EasyOCR reader for specified languages."""
    global _readers
    
    # Convert to EasyOCR language codes
    easy_langs = []
    for lang in languages:
        if lang in LANG_MAP:
            easy_langs.append(LANG_MAP[lang])
        elif lang in SUPPORTED_LANGUAGES:
            easy_langs.append(lang)
        elif lang == 'auto':
            easy_langs = ['en', 'hi']  # Default: English + Hindi (compatible)
            break
    
    if not easy_langs:
        easy_langs = ['en']
    
    # EasyOCR language compatibility rules:
    # - Hindi (hi) is only compatible with English (en)
    # - Telugu (te) is only compatible with English (en)
    # - Tamil (ta) is only compatible with English (en)
    # - Cannot mix multiple Indian languages together
    
    # Check for incompatible combinations and fix them
    indian_langs = {'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or', 'as', 'ne'}
    found_indian = [l for l in easy_langs if l in indian_langs]
    
    if len(found_indian) > 1:
        # Multiple Indian languages - keep only the first one + English
        print(f"Multiple Indian languages detected: {found_indian}, using only {found_indian[0]} + en", file=sys.stderr)
        easy_langs = [found_indian[0], 'en']
    elif len(found_indian) == 1:
        # Single Indian language - ensure English is included
        if 'en' not in easy_langs:
            easy_langs = [found_indian[0], 'en']
        else:
            easy_langs = [found_indian[0], 'en']
    
    # Create cache key
    cache_key = '+'.join(sorted(easy_langs))
    
    if cache_key not in _readers:
        print(f"Creating EasyOCR reader for: {easy_langs}", file=sys.stderr)
        _readers[cache_key] = easyocr.Reader(easy_langs, gpu=False, verbose=False)
    
    return _readers[cache_key], easy_langs


def process_image(image_data, languages=['en'], enhance=True):
    """Process image and extract text using EasyOCR."""
    if not EASYOCR_AVAILABLE:
        return {'error': 'EasyOCR not installed', 'text': ''}
    
    try:
        # Decode base64 image if needed
        if isinstance(image_data, str):
            image_bytes = base64.b64decode(image_data)
        else:
            image_bytes = image_data
        
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Enhance image for better OCR
        if enhance:
            image = enhance_image(image)
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Get reader
        reader, used_langs = get_reader(languages)
        
        # Perform OCR
        results = reader.readtext(img_array, detail=1, paragraph=True)
        
        # Extract text and confidence
        texts = []
        total_confidence = 0
        word_count = 0
        
        for detection in results:
            if len(detection) >= 2:
                text = detection[1] if len(detection) > 1 else detection[0]
                confidence = detection[2] if len(detection) > 2 else 0.8
                
                if isinstance(text, str) and text.strip():
                    texts.append(text.strip())
                    total_confidence += confidence
                    word_count += 1
        
        full_text = '\n'.join(texts)
        avg_confidence = total_confidence / word_count if word_count > 0 else 0
        
        return {
            'text': full_text,
            'confidence': avg_confidence,
            'languages': used_langs,
            'word_count': word_count,
            'engine': 'easyocr'
        }
        
    except Exception as e:
        return {'error': str(e), 'text': ''}


def enhance_image(image):
    """Enhance image for better OCR results."""
    try:
        from PIL import ImageEnhance, ImageFilter
        
        # Resize if too small
        width, height = image.size
        if width < 1000 or height < 1000:
            scale = max(1000 / width, 1000 / height)
            new_size = (int(width * scale), int(height * scale))
            image = image.resize(new_size, Image.LANCZOS)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.3)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)
        
        return image
    except:
        return image


def process_pdf(pdf_data, languages=['en'], enhance=True, max_pages=50):
    """Process PDF and extract text using EasyOCR."""
    if not PYMUPDF_AVAILABLE:
        return {'error': 'PyMuPDF not installed', 'text': ''}
    
    if not EASYOCR_AVAILABLE:
        return {'error': 'EasyOCR not installed', 'text': ''}
    
    try:
        # Decode base64 if needed
        if isinstance(pdf_data, str):
            pdf_bytes = base64.b64decode(pdf_data)
        else:
            pdf_bytes = pdf_data
        
        # Open PDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        all_text = []
        pages_data = []
        total_confidence = 0
        page_count = min(len(doc), max_pages)
        
        # Get reader once for all pages
        reader, used_langs = get_reader(languages)
        
        for page_num in range(page_count):
            page = doc[page_num]
            
            # First try to extract embedded text
            embedded_text = page.get_text().strip()
            
            if len(embedded_text) > 50:
                # Page has embedded text
                all_text.append(embedded_text)
                pages_data.append({
                    'page': page_num + 1,
                    'text': embedded_text,
                    'confidence': 0.95,
                    'method': 'embedded'
                })
                total_confidence += 0.95
            else:
                # Need OCR - render page as image
                mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
                pix = page.get_pixmap(matrix=mat)
                img_bytes = pix.tobytes("png")
                
                # Process with EasyOCR
                image = Image.open(io.BytesIO(img_bytes))
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                if enhance:
                    image = enhance_image(image)
                
                img_array = np.array(image)
                results = reader.readtext(img_array, detail=1, paragraph=True)
                
                page_texts = []
                page_confidence = 0
                word_count = 0
                
                for detection in results:
                    if len(detection) >= 2:
                        text = detection[1] if len(detection) > 1 else detection[0]
                        confidence = detection[2] if len(detection) > 2 else 0.8
                        
                        if isinstance(text, str) and text.strip():
                            page_texts.append(text.strip())
                            page_confidence += confidence
                            word_count += 1
                
                page_text = '\n'.join(page_texts)
                avg_conf = page_confidence / word_count if word_count > 0 else 0
                
                all_text.append(page_text)
                pages_data.append({
                    'page': page_num + 1,
                    'text': page_text,
                    'confidence': avg_conf,
                    'method': 'ocr'
                })
                total_confidence += avg_conf
        
        doc.close()
        
        full_text = '\n\n'.join(all_text)
        avg_confidence = total_confidence / page_count if page_count > 0 else 0
        
        return {
            'text': full_text,
            'confidence': avg_confidence,
            'page_count': page_count,
            'pages': pages_data,
            'languages': used_langs,
            'engine': 'easyocr'
        }
        
    except Exception as e:
        return {'error': str(e), 'text': ''}


def get_supported_languages():
    """Return list of all supported languages."""
    return SUPPORTED_LANGUAGES


def main():
    """Main entry point for CLI usage."""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'languages':
        print(json.dumps(SUPPORTED_LANGUAGES))
        sys.exit(0)
    
    if command == 'health':
        health = {
            'easyocr': EASYOCR_AVAILABLE,
            'pil': PIL_AVAILABLE,
            'pymupdf': PYMUPDF_AVAILABLE,
            'languages': len(SUPPORTED_LANGUAGES)
        }
        print(json.dumps(health))
        sys.exit(0)
    
    if command in ['image', 'pdf']:
        # Read input from stdin
        try:
            stdin_data = sys.stdin.read()
            if not stdin_data:
                print(json.dumps({'error': 'No input data received'}))
                sys.exit(1)
            
            input_data = json.loads(stdin_data)
        except json.JSONDecodeError as e:
            print(json.dumps({'error': f'Invalid JSON input: {str(e)}'}))
            sys.exit(1)
        except Exception as e:
            print(json.dumps({'error': f'Failed to read input: {str(e)}'}))
            sys.exit(1)
        
        data = input_data.get('data', '')
        languages = input_data.get('languages', ['en'])
        enhance = input_data.get('enhance', True)
        
        if not data:
            print(json.dumps({'error': 'No image/pdf data provided'}))
            sys.exit(1)
        
        print(f"Processing {command} with languages: {languages}", file=sys.stderr)
        
        if command == 'image':
            result = process_image(data, languages, enhance)
        else:
            max_pages = input_data.get('max_pages', 50)
            result = process_pdf(data, languages, enhance, max_pages)
        
        print(json.dumps(result))
        sys.exit(0)
    
    print(json.dumps({'error': f'Unknown command: {command}'}))
    sys.exit(1)


if __name__ == '__main__':
    main()
