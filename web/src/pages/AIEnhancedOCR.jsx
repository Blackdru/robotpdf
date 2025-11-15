import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Zap, Shield, Globe, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const AIEnhancedOCR = () => {
  useEffect(() => {
    // Add FAQ structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is AI-Enhanced OCR for PDF?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI-Enhanced OCR (Optical Character Recognition) uses advanced artificial intelligence to extract text from scanned PDFs and images with superior accuracy. Unlike traditional OCR, our AI-powered solution can handle complex layouts, multiple languages, handwriting, and low-quality scans with exceptional precision."
          }
        },
        {
          "@type": "Question",
          "name": "Is AI-Enhanced OCR secure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, security is our top priority. All files are encrypted during upload and processing. We use industry-standard SSL/TLS encryption, and your files are automatically deleted from our servers after processing. We never share your documents with third parties."
          }
        },
        {
          "@type": "Question",
          "name": "What languages does AI-Enhanced OCR support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our AI-Enhanced OCR supports over 100 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, and many more. The AI automatically detects the language in your document for optimal accuracy."
          }
        },
        {
          "@type": "Question",
          "name": "How accurate is AI-Enhanced OCR compared to traditional OCR?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI-Enhanced OCR achieves 95-99% accuracy even on challenging documents, compared to 70-85% for traditional OCR. Our AI models are trained on millions of documents and can handle poor quality scans, complex layouts, tables, and mixed content types with superior results."
          }
        },
        {
          "@type": "Question",
          "name": "Can I use AI-Enhanced OCR for free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! We offer a free tier that allows you to process a limited number of pages per month. For higher volumes and advanced features, check out our Pro and Business plans on the pricing page."
          }
        },
        {
          "@type": "Question",
          "name": "What file formats are supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI-Enhanced OCR supports PDF files, as well as image formats including JPG, PNG, TIFF, and BMP. You can upload scanned documents, photos of documents, or any image containing text."
          }
        },
        {
          "@type": "Question",
          "name": "How long does OCR processing take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Processing time depends on document size and complexity. Most single-page documents are processed in 5-15 seconds. Multi-page documents may take 30 seconds to a few minutes. Our AI optimization ensures fast processing without compromising accuracy."
          }
        },
        {
          "@type": "Question",
          "name": "Can AI-Enhanced OCR handle handwritten text?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our AI-Enhanced OCR includes handwriting recognition capabilities. While accuracy depends on handwriting legibility, our AI models are trained to recognize various handwriting styles and can extract text from handwritten notes, forms, and documents."
          }
        }
      ]
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI-Enhanced OCR for PDF — Extract Text with Precision
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Transform scanned PDFs and images into editable, searchable text using advanced AI technology. 
            Our intelligent OCR delivers 99% accuracy across 100+ languages, handling complex layouts, 
            tables, and even handwriting with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Start Free OCR Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How AI-Enhanced OCR Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your PDF</h3>
              <p className="text-muted-foreground">
                Upload any scanned PDF or image containing text. Supports multiple pages and various formats.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI analyzes the document, detects language, and extracts text with superior accuracy.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Results</h3>
              <p className="text-muted-foreground">
                Get your searchable PDF or editable text file instantly. Copy, edit, or export as needed.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful AI-Enhanced OCR Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Lightning-Fast Processing</h3>
                <p className="text-muted-foreground">
                  Process documents in seconds with our optimized AI models. Batch processing available for multiple files.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">100+ Languages</h3>
                <p className="text-muted-foreground">
                  Automatic language detection and support for over 100 languages including complex scripts.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Bank-Level Security</h3>
                <p className="text-muted-foreground">
                  End-to-end encryption, automatic file deletion, and GDPR compliance ensure your data stays private.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Complex Layout Recognition</h3>
                <p className="text-muted-foreground">
                  Accurately extract text from tables, columns, forms, and documents with mixed content types.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">99% Accuracy</h3>
                <p className="text-muted-foreground">
                  Industry-leading accuracy even on low-quality scans, faded documents, and challenging layouts.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Handwriting Recognition</h3>
                <p className="text-muted-foreground">
                  Extract text from handwritten notes and forms with our advanced AI handwriting recognition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What is AI-Enhanced OCR for PDF?</h3>
              <p className="text-muted-foreground">
                AI-Enhanced OCR (Optical Character Recognition) uses advanced artificial intelligence to extract 
                text from scanned PDFs and images with superior accuracy. Unlike traditional OCR, our AI-powered 
                solution can handle complex layouts, multiple languages, handwriting, and low-quality scans with 
                exceptional precision.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Is AI-Enhanced OCR secure?</h3>
              <p className="text-muted-foreground">
                Yes, security is our top priority. All files are encrypted during upload and processing. We use 
                industry-standard SSL/TLS encryption, and your files are automatically deleted from our servers 
                after processing. We never share your documents with third parties.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What languages does AI-Enhanced OCR support?</h3>
              <p className="text-muted-foreground">
                Our AI-Enhanced OCR supports over 100 languages including English, Spanish, French, German, 
                Chinese, Japanese, Arabic, Hindi, and many more. The AI automatically detects the language in 
                your document for optimal accuracy.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How accurate is AI-Enhanced OCR compared to traditional OCR?</h3>
              <p className="text-muted-foreground">
                AI-Enhanced OCR achieves 95-99% accuracy even on challenging documents, compared to 70-85% for 
                traditional OCR. Our AI models are trained on millions of documents and can handle poor quality 
                scans, complex layouts, tables, and mixed content types with superior results.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I use AI-Enhanced OCR for free?</h3>
              <p className="text-muted-foreground">
                Yes! We offer a free tier that allows you to process a limited number of pages per month. For 
                higher volumes and advanced features, check out our Pro and Business plans on the pricing page.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What file formats are supported?</h3>
              <p className="text-muted-foreground">
                AI-Enhanced OCR supports PDF files, as well as image formats including JPG, PNG, TIFF, and BMP. 
                You can upload scanned documents, photos of documents, or any image containing text.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How long does OCR processing take?</h3>
              <p className="text-muted-foreground">
                Processing time depends on document size and complexity. Most single-page documents are processed 
                in 5-15 seconds. Multi-page documents may take 30 seconds to a few minutes. Our AI optimization 
                ensures fast processing without compromising accuracy.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can AI-Enhanced OCR handle handwritten text?</h3>
              <p className="text-muted-foreground">
                Yes, our AI-Enhanced OCR includes handwriting recognition capabilities. While accuracy depends on 
                handwriting legibility, our AI models are trained to recognize various handwriting styles and can 
                extract text from handwritten notes, forms, and documents.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Related AI PDF Tools
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/ai-chat-with-pdf">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">Chat with PDF</h3>
                <p className="text-muted-foreground">
                  Ask questions and get instant answers from your PDF documents using AI.
                </p>
              </Card>
            </Link>
            <Link to="/ai-smart-summary">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">Smart Summary</h3>
                <p className="text-muted-foreground">
                  Generate intelligent summaries of long PDF documents in seconds.
                </p>
              </Card>
            </Link>
            <Link to="/pricing">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-2">View All Plans</h3>
                <p className="text-muted-foreground">
                  Explore our pricing options and find the perfect plan for your needs.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Extract Text with AI Precision?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who trust RobotPDF for accurate, secure OCR processing.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default AIEnhancedOCR
