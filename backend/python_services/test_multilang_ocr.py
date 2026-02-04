#!/usr/bin/env python3
"""
Comprehensive Multi-Language OCR Test Suite
Tests EasyOCR with various languages and validates accuracy
"""

import sys
import json
import base64
import time
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests
    REQUESTS_AVAILABLE = True

# Test cases with different languages
TEST_CASES = [
    {
        'name': 'English',
        'text': 'Hello World\nThis is a test document\nOCR Testing 2024',
        'languages': ['en'],
        'expected_keywords': ['Hello', 'World', 'test', 'document', 'OCR', '2024']
    },
    {
        'name': 'Hindi (Devanagari)',
        'text': 'नमस्ते\nभारत\nपरीक्षण',
        'languages': ['hi'],
        'expected_keywords': ['नमस्ते', 'भारत', 'परीक्षण']
    },
    {
        'name': 'Telugu',
        'text': 'హలో\nతెలుగు\nపరీక్ష',
        'languages': ['te'],
        'expected_keywords': ['హలో', 'తెలుగు', 'పరీక్ష']
    },
    {
        'name': 'English + Hindi Mixed',
        'text': 'Hello World\nनमस्ते भारत\nMixed Language Test',
        'languages': ['en', 'hi'],
        'expected_keywords': ['Hello', 'World', 'नमस्ते', 'भारत', 'Mixed', 'Language']
    },
    {
        'name': 'English + Telugu Mixed',
        'text': 'Hello World\nహలో తెలుగు\nMixed Language Test',
        'languages': ['en', 'te'],
        'expected_keywords': ['Hello', 'World', 'హలో', 'తెలుగు', 'Mixed']
    },
    {
        'name': 'Spanish',
        'text': 'Hola Mundo\nEsta es una prueba\nPrueba de OCR 2024',
        'languages': ['es'],
        'expected_keywords': ['Hola', 'Mundo', 'prueba', 'OCR']
    },
    {
        'name': 'French',
        'text': 'Bonjour le monde\nCeci est un test\nTest OCR 2024',
        'languages': ['fr'],
        'expected_keywords': ['Bonjour', 'monde', 'test', 'OCR']
    },
    {
        'name': 'German',
        'text': 'Hallo Welt\nDies ist ein Test\nOCR Test 2024',
        'languages': ['de'],
        'expected_keywords': ['Hallo', 'Welt', 'Test', 'OCR']
    },
    {
        'name': 'Arabic (RTL)',
        'text': 'مرحبا\nاختبار\nعربي',
        'languages': ['ar'],
        'expected_keywords': ['مرحبا', 'اختبار', 'عربي']
    },
    {
        'name': 'Numbers and Symbols',
        'text': '1234567890\nABC-123-XYZ\nTest@2024!',
        'languages': ['en'],
        'expected_keywords': ['1234567890', 'ABC', '123', 'XYZ', 'Test', '2024']
    },
    {
        'name': 'Real Document (English)',
        'text': 'Address: 2-70/2, CHETLAPOTHARAM\nJINNARAM, SANGAREDDY\nTELANGANA-502319\nDownload Date: 28-10-2023',
        'languages': ['en'],
        'expected_keywords': ['Address', 'CHETLAPOTHARAM', 'JINNARAM', 'SANGAREDDY', 'TELANGANA', '502319', '2023']
    }
]

class OCRTester:
    def __init__(self, server_url='http://127.0.0.1:5050'):
        self.server_url = server_url
        self.results = []
        
    def check_server_health(self):
        """Check if OCR server is running"""
        try:
            response = requests.get(f'{self.server_url}/health', timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✓ OCR Server is running")
                print(f"  Status: {data.get('status')}")
                print(f"  Pre-loaded readers: {data.get('readers')}")
                print(f"  Supported languages: {data.get('languages')}")
                return True
            else:
                print(f"✗ Server returned status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Cannot connect to OCR server: {e}")
            print(f"  Make sure the server is running on {self.server_url}")
            print(f"  Start it with: python ocr_server.py")
            return False
    
    def create_test_image(self, text, size=(1200, 600), font_size=60):
        """Create a test image with the given text"""
        # Create white background with higher resolution
        img = Image.new('RGB', size, color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to find fonts that support Unicode scripts
        font_paths = [
            # Windows fonts
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\arialuni.ttf",  # Arial Unicode MS
            "C:\\Windows\\Fonts\\NotoSans-Regular.ttf",
            "C:\\Windows\\Fonts\\seguisym.ttf",
            # Linux fonts
            "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            # Mac fonts
            "/Library/Fonts/Arial Unicode.ttf",
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        ]
        
        font = None
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue
        
        if font is None:
            # If no TrueType font found, use larger default font
            try:
                font = ImageFont.load_default()
                # Scale up the image to compensate for small default font
                size = (1600, 800)
                img = Image.new('RGB', size, color='white')
                draw = ImageDraw.Draw(img)
                font_size = 20  # Adjust for default font
            except:
                pass
        
        # Draw text with better spacing and positioning
        y_position = 80
        line_spacing = int(font_size * 1.5)
        
        for line in text.split('\n'):
            if line.strip():  # Only draw non-empty lines
                # Center text horizontally
                try:
                    bbox = draw.textbbox((0, 0), line, font=font)
                    text_width = bbox[2] - bbox[0]
                    x_position = (size[0] - text_width) // 2
                except:
                    x_position = 100  # Fallback position
                
                draw.text((x_position, y_position), line, fill='black', font=font)
                y_position += line_spacing
        
        return img
    
    def image_to_base64(self, image):
        """Convert PIL Image to base64 string"""
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    def perform_ocr(self, image_base64, languages, enhance=True):
        """Perform OCR using the server"""
        try:
            response = requests.post(
                f'{self.server_url}/ocr/image',
                json={
                    'data': image_base64,
                    'languages': languages,
                    'enhance': enhance
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f'Server returned status {response.status_code}'}
        except Exception as e:
            return {'error': str(e)}
    
    def validate_result(self, result, expected_keywords):
        """Validate OCR result against expected keywords"""
        if 'error' in result:
            return False, 0, f"Error: {result['error']}"
        
        text = result.get('text', '').lower()
        found_keywords = []
        missing_keywords = []
        
        for keyword in expected_keywords:
            # For non-ASCII keywords, check exact match
            # For ASCII keywords, check case-insensitive
            if keyword.isascii():
                if keyword.lower() in text:
                    found_keywords.append(keyword)
                else:
                    missing_keywords.append(keyword)
            else:
                if keyword in result.get('text', ''):
                    found_keywords.append(keyword)
                else:
                    missing_keywords.append(keyword)
        
        accuracy = len(found_keywords) / len(expected_keywords) if expected_keywords else 0
        
        if accuracy >= 0.7:  # 70% threshold
            status = "PASS"
        elif accuracy >= 0.5:
            status = "PARTIAL"
        else:
            status = "FAIL"
        
        details = {
            'found': found_keywords,
            'missing': missing_keywords,
            'accuracy': accuracy
        }
        
        return status, accuracy, details
    
    def run_test(self, test_case):
        """Run a single test case"""
        print(f"\n{'='*70}")
        print(f"Testing: {test_case['name']}")
        print(f"Languages: {test_case['languages']}")
        print(f"{'='*70}")
        
        # Create test image
        print("1. Creating test image...")
        image = self.create_test_image(test_case['text'])
        image_base64 = self.image_to_base64(image)
        print(f"   ✓ Image created ({len(image_base64)} bytes)")
        
        # Perform OCR
        print("2. Performing OCR...")
        start_time = time.time()
        result = self.perform_ocr(image_base64, test_case['languages'])
        elapsed_time = time.time() - start_time
        
        if 'error' in result:
            print(f"   ✗ OCR failed: {result['error']}")
            return {
                'name': test_case['name'],
                'status': 'ERROR',
                'error': result['error'],
                'time': elapsed_time
            }
        
        print(f"   ✓ OCR completed in {elapsed_time:.2f}s")
        print(f"   Engine: {result.get('engine', 'unknown')}")
        print(f"   Confidence: {result.get('confidence', 0):.2%}")
        
        # Validate result
        print("3. Validating results...")
        status, accuracy, details = self.validate_result(result, test_case['expected_keywords'])
        
        print(f"   Status: {status}")
        print(f"   Accuracy: {accuracy:.2%}")
        print(f"   Found keywords: {len(details['found'])}/{len(test_case['expected_keywords'])}")
        
        if details['missing']:
            print(f"   Missing keywords: {details['missing']}")
        
        # Show extracted text
        print("\n4. Extracted Text:")
        print("-" * 70)
        print(result.get('text', '(empty)'))
        print("-" * 70)
        
        # Return test result
        test_result = {
            'name': test_case['name'],
            'languages': test_case['languages'],
            'status': status,
            'accuracy': accuracy,
            'confidence': result.get('confidence', 0),
            'time': elapsed_time,
            'engine': result.get('engine', 'unknown'),
            'found_keywords': details['found'],
            'missing_keywords': details['missing'],
            'extracted_text': result.get('text', '')
        }
        
        self.results.append(test_result)
        return test_result
    
    def run_all_tests(self):
        """Run all test cases"""
        print("\n" + "="*70)
        print("MULTI-LANGUAGE OCR TEST SUITE")
        print("="*70)
        
        # Check server health
        if not self.check_server_health():
            print("\n❌ Cannot proceed without OCR server")
            return False
        
        # Run all tests
        print(f"\nRunning {len(TEST_CASES)} test cases...")
        
        for test_case in TEST_CASES:
            try:
                self.run_test(test_case)
            except Exception as e:
                print(f"\n✗ Test failed with exception: {e}")
                self.results.append({
                    'name': test_case['name'],
                    'status': 'EXCEPTION',
                    'error': str(e)
                })
        
        # Print summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.get('status') == 'PASS')
        partial = sum(1 for r in self.results if r.get('status') == 'PARTIAL')
        failed = sum(1 for r in self.results if r.get('status') in ['FAIL', 'ERROR', 'EXCEPTION'])
        
        print(f"\nTotal Tests: {total}")
        print(f"✓ Passed: {passed} ({passed/total*100:.1f}%)")
        print(f"⚠ Partial: {partial} ({partial/total*100:.1f}%)")
        print(f"✗ Failed: {failed} ({failed/total*100:.1f}%)")
        
        # Detailed results table
        print("\n" + "-"*70)
        print(f"{'Test Name':<25} {'Status':<10} {'Accuracy':<10} {'Time':<8}")
        print("-"*70)
        
        for result in self.results:
            name = result['name'][:24]
            status = result.get('status', 'N/A')
            accuracy = f"{result.get('accuracy', 0):.1%}" if 'accuracy' in result else 'N/A'
            time_str = f"{result.get('time', 0):.2f}s" if 'time' in result else 'N/A'
            
            # Color coding
            if status == 'PASS':
                status_display = f"✓ {status}"
            elif status == 'PARTIAL':
                status_display = f"⚠ {status}"
            else:
                status_display = f"✗ {status}"
            
            print(f"{name:<25} {status_display:<10} {accuracy:<10} {time_str:<8}")
        
        print("-"*70)
        
        # Average metrics
        valid_results = [r for r in self.results if 'accuracy' in r]
        if valid_results:
            avg_accuracy = sum(r['accuracy'] for r in valid_results) / len(valid_results)
            avg_confidence = sum(r['confidence'] for r in valid_results) / len(valid_results)
            avg_time = sum(r['time'] for r in valid_results) / len(valid_results)
            
            print(f"\nAverage Accuracy: {avg_accuracy:.2%}")
            print(f"Average Confidence: {avg_confidence:.2%}")
            print(f"Average Time: {avg_time:.2f}s")
        
        # Recommendations
        print("\n" + "="*70)
        print("RECOMMENDATIONS")
        print("="*70)
        
        if failed > 0:
            print("\n⚠ Some tests failed. Possible issues:")
            print("  1. Font rendering issues for non-Latin scripts")
            print("  2. Language models not properly loaded")
            print("  3. Image quality or size issues")
            print("\nSuggested fixes:")
            print("  - Ensure proper fonts are installed for all scripts")
            print("  - Verify language models are downloaded")
            print("  - Try with higher resolution images")
        
        if avg_accuracy < 0.8:
            print("\n⚠ Average accuracy is below 80%")
            print("  - Enable image enhancement")
            print("  - Use higher quality source images")
            print("  - Consider AI post-processing")
        
        if passed == total:
            print("\n✓ All tests passed! OCR system is working correctly.")
        
        print("\n" + "="*70)
        
        # Save results to JSON
        try:
            with open('ocr_test_results.json', 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            print("\n✓ Results saved to: ocr_test_results.json")
        except Exception as e:
            print(f"\n⚠ Could not save results: {e}")

def main():
    """Main entry point"""
    tester = OCRTester()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)
    
    # Exit with appropriate code
    failed = sum(1 for r in tester.results if r.get('status') in ['FAIL', 'ERROR', 'EXCEPTION'])
    sys.exit(0 if failed == 0 else 1)

if __name__ == '__main__':
    main()
