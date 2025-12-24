#!/usr/bin/env python3
"""
Advanced OCR Service - Tesseract-based (Lightweight)
Supports 100+ languages with good accuracy using pytesseract.
Low memory footprint (~200MB RAM).
"""

import sys
import json
import os
import tempfile
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Any


class AdvancedOCR:
    """Tesseract-based OCR with preprocessing for better accuracy."""
    
    def __init__(self):
        self._engines_available = {
            'tesseract': False
        }
        self._check_available_engines()
    
    def _check_available_engines(self):
        """Check if Tesseract is available."""
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            self._engines_available['tesseract'] = True
        except:
            pass
    
    def get_available_engines(self) -> Dict[str, bool]:
        """Return available OCR engines."""
        return self._engines_available.copy()

    def preprocess_image(self, image_path: str) -> str:
        """Preprocess image for better OCR accuracy."""
        try:
            from PIL import Image, ImageEnhance
            
            img = Image.open(image_path)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too small
            min_dim = min(img.size)
            if min_dim < 1500:
                scale = 2000 / min_dim
                new_size = (int(img.size[0] * scale), int(img.size[1] * scale))
                img = img.resize(new_size, Image.LANCZOS)
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.8)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(2.5)
            
            # Save preprocessed image
            output_path = image_path.replace('.', '_preprocessed.')
            img.save(output_path, quality=100)
            
            return output_path
            
        except Exception as e:
            print(f"Preprocessing failed: {e}", file=sys.stderr)
            return image_path
    
    def extract_text_tesseract(self, image_path: str, languages: List[str]) -> Dict[str, Any]:
        """Extract text using Tesseract."""
        try:
            import pytesseract
            from PIL import Image
            
            # Convert language codes to Tesseract format
            tess_langs = '+'.join(languages) if languages else 'eng'
            
            print(f"Tesseract: Processing {image_path} with languages: {tess_langs}", file=sys.stderr)
            
            # Load image
            img = Image.open(image_path)
            
            # Get detailed OCR data
            data = pytesseract.image_to_data(
                img,
                lang=tess_langs,
                output_type=pytesseract.Output.DICT,
                config='--psm 3 --oem 3'
            )
            
            # Extract text and confidence
            texts = []
            confidences = []
            
            for i, text in enumerate(data['text']):
                if text.strip():
                    conf = int(data['conf'][i]) / 100 if data['conf'][i] != -1 else 0.5
                    texts.append(text)
                    confidences.append(conf)
            
            full_text = ' '.join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            print(f"Tesseract: Extracted {len(full_text)} chars, confidence: {avg_confidence:.2f}", file=sys.stderr)
            
            return {
                'text': full_text,
                'confidence': avg_confidence,
                'engine': 'tesseract'
            }
            
        except Exception as e:
            print(f"Tesseract error: {e}", file=sys.stderr)
            return {
                'text': '',
                'confidence': 0,
                'error': str(e),
                'engine': 'tesseract'
            }
    
    def extract_text(
        self,
        image_path: str,
        languages: Optional[List[str]] = None,
        engine: str = 'auto',
        preprocess: bool = True
    ) -> Dict[str, Any]:
        """Extract text from image using Tesseract."""
        
        # Default to English + Hindi for Indian documents
        if not languages or languages == ['auto'] or languages == ['eng']:
            languages = ['eng', 'hin']
            print(f"Auto-selecting languages: {languages}", file=sys.stderr)
        
        # Preprocess image
        processed_path = image_path
        if preprocess:
            processed_path = self.preprocess_image(image_path)
        
        # Extract text
        if self._engines_available['tesseract']:
            result = self.extract_text_tesseract(processed_path, languages)
        else:
            result = {
                'text': '',
                'confidence': 0,
                'error': 'Tesseract not available'
            }
        
        # Cleanup preprocessed image
        if processed_path != image_path and os.path.exists(processed_path):
            try:
                os.remove(processed_path)
            except:
                pass
        
        result['languages_detected'] = languages
        result['success'] = bool(result.get('text'))
        return result

    def extract_text_from_pdf(
        self,
        pdf_path: str,
        languages: Optional[List[str]] = None,
        engine: str = 'auto',
        max_pages: int = 100
    ) -> Dict[str, Any]:
        """Extract text from PDF using OCR."""
        try:
            import fitz  # PyMuPDF
            
            doc = fitz.open(pdf_path)
            total_pages = min(len(doc), max_pages)
            
            all_text = []
            all_confidence = []
            pages_data = []
            
            for page_num in range(total_pages):
                page = doc[page_num]
                
                # First try embedded text
                embedded_text = page.get_text().strip()
                
                if len(embedded_text) > 50:
                    all_text.append(embedded_text)
                    all_confidence.append(0.95)
                    pages_data.append({
                        'page': page_num + 1,
                        'text': embedded_text,
                        'confidence': 0.95,
                        'method': 'embedded'
                    })
                else:
                    # Need OCR
                    mat = fitz.Matrix(2.0, 2.0)
                    pix = page.get_pixmap(matrix=mat)
                    
                    temp_img = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                    pix.save(temp_img.name)
                    temp_img.close()
                    
                    try:
                        result = self.extract_text(temp_img.name, languages, engine, True)
                        all_text.append(result.get('text', ''))
                        all_confidence.append(result.get('confidence', 0))
                        pages_data.append({
                            'page': page_num + 1,
                            'text': result.get('text', ''),
                            'confidence': result.get('confidence', 0),
                            'method': 'ocr',
                            'engine': 'tesseract'
                        })
                    finally:
                        try:
                            os.remove(temp_img.name)
                        except:
                            pass
            
            doc.close()
            
            full_text = '\n\n'.join(all_text)
            avg_confidence = sum(all_confidence) / len(all_confidence) if all_confidence else 0
            
            return {
                'success': True,
                'text': full_text,
                'confidence': avg_confidence,
                'page_count': total_pages,
                'pages': pages_data,
                'languages_detected': languages or ['eng']
            }
            
        except Exception as e:
            return {
                'success': False,
                'text': '',
                'confidence': 0,
                'error': str(e),
                'traceback': traceback.format_exc()
            }


def get_supported_languages() -> Dict[str, str]:
    """Return supported languages."""
    return {
        'eng': 'English', 'hin': 'Hindi', 'tel': 'Telugu', 'tam': 'Tamil',
        'kan': 'Kannada', 'mal': 'Malayalam', 'mar': 'Marathi', 'ben': 'Bengali',
        'guj': 'Gujarati', 'pan': 'Punjabi', 'ori': 'Odia', 'urd': 'Urdu',
        'nep': 'Nepali', 'san': 'Sanskrit', 'asm': 'Assamese',
        'chi_sim': 'Chinese (Simplified)', 'chi_tra': 'Chinese (Traditional)',
        'jpn': 'Japanese', 'kor': 'Korean', 'vie': 'Vietnamese', 'tha': 'Thai',
        'spa': 'Spanish', 'fra': 'French', 'deu': 'German', 'ita': 'Italian',
        'por': 'Portuguese', 'rus': 'Russian', 'ara': 'Arabic', 'heb': 'Hebrew',
        'tur': 'Turkish', 'pol': 'Polish', 'nld': 'Dutch', 'ind': 'Indonesian'
    }


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python advanced_ocr.py <command> [args]',
            'commands': ['extract <image>', 'extract_pdf <pdf>', 'languages', 'engines']
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    ocr = AdvancedOCR()
    
    try:
        if command == 'extract':
            image_path = sys.argv[2]
            languages = sys.argv[3].split(',') if len(sys.argv) > 3 else None
            
            if not os.path.exists(image_path):
                print(json.dumps({'success': False, 'error': f'File not found: {image_path}'}))
                sys.exit(1)
            
            result = ocr.extract_text(image_path, languages)
            print(json.dumps(result))
            
        elif command == 'extract_pdf':
            pdf_path = sys.argv[2]
            languages = sys.argv[3].split(',') if len(sys.argv) > 3 else None
            max_pages = int(sys.argv[4]) if len(sys.argv) > 4 else 100
            
            if not os.path.exists(pdf_path):
                print(json.dumps({'success': False, 'error': f'File not found: {pdf_path}'}))
                sys.exit(1)
            
            result = ocr.extract_text_from_pdf(pdf_path, languages, 'auto', max_pages)
            print(json.dumps(result))
            
        elif command == 'languages':
            print(json.dumps({'success': True, 'languages': get_supported_languages()}))
            
        elif command == 'engines':
            print(json.dumps({'success': True, 'engines': ocr.get_available_engines()}))
            
        else:
            print(json.dumps({'success': False, 'error': f'Unknown command: {command}'}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'traceback': traceback.format_exc()}))
        sys.exit(1)


if __name__ == '__main__':
    main()
